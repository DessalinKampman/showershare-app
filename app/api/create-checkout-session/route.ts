import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      price,
      showerId,
      guestId,
      date,
      time,
      availabilitySlotId,
      endTime,
    } = body;

    if (!title || !price || !showerId || !guestId || !date || !time) {
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

    const verifiedPrice = Number(verifiedListing.price_per_use);

    if (!Number.isFinite(verifiedPrice) || verifiedPrice < 0.5) {
      return NextResponse.json(
        { error: "Ongeldige doucheprijs." },
        { status: 400 }
      );
    }

    const subtotalCents = Math.round(verifiedPrice * 100);
    const platformFeeCents = Math.round(subtotalCents * 0.15);
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
