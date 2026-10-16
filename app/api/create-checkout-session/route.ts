import { calculatePlatformFee } from "@/lib/platformConfig";
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      price,
      showerId,
      date,
      time,
      availabilitySlotId,
      endTime,
    } = body;

    const authorization = request.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om te boeken." },
        { status: 401 }
      );
    }

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: authData, error: authError } =
      await supabaseAuth.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Je sessie is ongeldig. Log opnieuw in." },
        { status: 401 }
      );
    }

    const guestId = authData.user.id;

    if (!title || !price || !showerId || !date || !time) {
      return NextResponse.json(
        { error: "Ontbrekende boekingsgegevens" },
        { status: 400 }
      );
    }


    // Controleer de douchegegevens rechtstreeks in Supabase.
    const { data: verifiedListing, error: listingError } =
      await supabaseServer
        .from("listings")
        .select("id, title, price_per_use, available")
        .eq("id", showerId)
        .single();

    if (listingError || !verifiedListing) {
      return NextResponse.json(
        { error: "Douche niet gevonden." },
        { status: 404 }
      );
    }

    if (!verifiedListing.available) {
      return NextResponse.json(
        { error: "Deze douche is tijdelijk niet beschikbaar." },
        { status: 409 }
      );
    }

    // Controleer het gekozen tijdslot op de server.
  if (!availabilitySlotId || !endTime) {
    return NextResponse.json(
      { error: "Selecteer een geldig beschikbaar tijdslot." },
      { status: 400 }
    );
  }

  const { data: verifiedSlot, error: slotError } =
    await supabaseServer
      .from("availability_slots")
      .select("id, shower_id, slot_date, start_time, end_time")
      .eq("id", availabilitySlotId)
      .eq("shower_id", showerId)
      .eq("slot_date", date)
      .eq("start_time", time)
      .eq("end_time", endTime)
      .maybeSingle();

  if (slotError || !verifiedSlot) {
    return NextResponse.json(
      { error: "Dit tijdslot is niet beschikbaar." },
      { status: 409 }
    );
  }

  const nlNow = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date()).replace(" ", "T");

  if (`${date}T${time.slice(0, 5)}` <= nlNow) {
    return NextResponse.json(
      { error: "Je kunt geen tijdslot in het verleden boeken." },
      { status: 409 }
    );
  }

  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };

  if (toMinutes(endTime) <= toMinutes(time)) {
    return NextResponse.json(
      { error: "Dit tijdslot heeft een ongeldige eindtijd." },
      { status: 400 }
    );
  }

  const verifiedPrice = Number(verifiedListing.price_per_use);

    if (!Number.isFinite(verifiedPrice) || verifiedPrice < 0.5) {
      return NextResponse.json(
        { error: "Ongeldige doucheprijs." },
        { status: 400 }
      );
    }

    const subtotalCents = Math.round(verifiedPrice * 100);
    const platformFeeCents = calculatePlatformFee(subtotalCents);
    const hostPayoutCents = subtotalCents - platformFeeCents;

    // 1. Maak EERST de pending booking aan en haal de booking-ID terug.
    const { data: booking, error: bookingError } = await supabaseServer
      .from("bookings")
      .insert({
        shower_id: showerId,
        guest_id: guestId,
        duration_minutes: 10,
        towel: false,
        subtotal_cents: subtotalCents,
        platform_fee_cents: platformFeeCents,
        host_payout_cents: hostPayoutCents,
        status: "pending",
        booking_date: date,
        booking_time: time,
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      if (bookingError?.code === "23P01") {
        return NextResponse.json(
          {
            error: "Dit tijdstip is helaas al gereserveerd. Kies een ander beschikbaar moment."
          },
          { status: 409 }
        );
      }
      console.error("Booking aanmaken mislukt:", bookingError);

      return NextResponse.json(
        {
          error:
            bookingError?.message ||
            "Pending booking kon niet worden aangemaakt.",
        },
        { status: 500 }
      );
    }

    const bookingId = booking.id;

    // 2. Maak daarna Stripe Checkout aan.
    // Nu hebben we de booking-ID en kunnen we die betrouwbaar
    // aan zowel de Checkout Session als PaymentIntent koppelen.
    let session;

    try {
      session = await stripe.checkout.sessions.create({
      mode: "payment",
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      payment_method_types: ["card", "ideal"],

      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: verifiedListing.title,
              description: `Douche op ${date} om ${time}`,
            },
            unit_amount: subtotalCents,
          },
          quantity: 1,
        },
      ],

      metadata: {
        bookingId,
        showerId,
        guestId,
        date,
        time,
        availabilitySlotId: availabilitySlotId || "",
        endTime: endTime || "",
      },

      payment_intent_data: {
        metadata: {
          bookingId,
          showerId,
          guestId,
        },
      },

      success_url: `${request.headers.get(
        "origin"
      )}/payment-success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${request.headers.get("origin")}/shower/${showerId}`,
    });

    } catch (stripeError) {
      console.error("Stripe-sessie aanmaken mislukt:", stripeError);

      const { error: cleanupError } = await supabaseServer
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId)
        .eq("status", "pending");

      if (cleanupError) {
        console.error("Pending reservering opruimen mislukt:", cleanupError);
      }

      return NextResponse.json(
        {
          error: cleanupError
            ? "Betaling kon niet worden gestart. Neem contact op met de ondersteuning."
            : "Betaling kon niet worden gestart. Probeer het opnieuw."
        },
        { status: 500 }
      );
    }

    // Koppel de Stripe Checkout-sessie aan deze reservering.
    const { data: linkedBooking, error: linkError } =
      await supabaseServer
        .from("bookings")
        .update({ stripe_checkout_session_id: session.id })
        .eq("id", bookingId)
        .eq("status", "pending")
        .is("stripe_checkout_session_id", null)
        .select("id")
        .maybeSingle();

    if (linkError || !linkedBooking) {
      console.error("Stripe-sessie koppelen mislukt:", linkError);

      // Beëindig eerst de Checkout-sessie.
      let safeToCancel = false;

      try {
        const expiredSession = await stripe.checkout.sessions.expire(session.id);
        safeToCancel = expiredSession.status === "expired";
      } catch (expireError) {
        console.error("Stripe-sessie beëindigen mislukt:", expireError);

        // Controleer de status als beëindigen mislukt.
        try {
          const currentSession =
            await stripe.checkout.sessions.retrieve(session.id);

          safeToCancel =
            currentSession.status === "expired" &&
            currentSession.payment_status !== "paid";
        } catch (retrieveError) {
          console.error("Stripe-status controleren mislukt:", retrieveError);
        }
      }

      if (safeToCancel) {
        const { error: cleanupError } = await supabaseServer
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", bookingId)
          .eq("status", "pending")
          .is("stripe_checkout_session_id", null);

        if (cleanupError) {
          console.error("Boeking vrijgeven mislukt:", cleanupError);
        }
      }

      return NextResponse.json(
        {
          error: safeToCancel
            ? "Betaling kon niet worden gestart. Probeer het opnieuw."
            : "Betaling kon niet veilig worden gestart. Neem contact op met ondersteuning.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: session.url,
      bookingId,
    });
  } catch (error: unknown) {
    console.error("Stripe Checkout error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Onbekende fout",
      },
      { status: 500 }
    );
  }
}
