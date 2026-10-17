import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabaseServer";


export async function POST(request: Request) {
  try {
    const { bookingId, newStatus } = await request.json();

    const authorization = request.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Log eerst in om reserveringen te beheren." },
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

    const hostId = authData.user.id;


    if (!bookingId || !["confirmed", "rejected"].includes(newStatus)) {
      return NextResponse.json(
        { error: "Ongeldige boekingsgegevens." },
        { status: 400 }
      );
    }

    const { data: booking, error: bookingError } = await supabaseServer
      .from("bookings")
      .select("id, shower_id, status, stripe_payment_intent_id")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Boeking niet gevonden." },
        { status: 404 }
      );
    }

    const { data: listing, error: listingError } =
      await supabaseServer
        .from("listings")
        .select("id")
        .eq("id", booking.shower_id)
        .eq("user_id", hostId)
        .maybeSingle();

    if (listingError) {
      throw listingError;
    }

    if (!listing) {
      return NextResponse.json(
        { error: "Je mag deze reservering niet beheren." },
        { status: 403 }
      );
    }

    if (booking.status !== "pending") {
      return NextResponse.json(
        { error: "Deze boeking is al verwerkt." },
        { status: 400 }
      );
    }

    if (newStatus === "rejected") {
      return NextResponse.json(
        { error: "Afwijzen met terugbetaling is tijdelijk uitgeschakeld." },
        { status: 409 }
      );
    }

    const { error: updateError } = await supabaseServer
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
    });
  } catch (error: unknown) {
    console.error("Update booking status error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Onbekende fout.",
      },
      { status: 500 }
    );
  }
}
