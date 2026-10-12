import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabaseServer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { bookingId, newStatus } = await request.json();

    if (!bookingId || !["confirmed", "rejected"].includes(newStatus)) {
      return NextResponse.json(
        { error: "Ongeldige boekingsgegevens." },
        { status: 400 }
      );
    }

    const { data: booking, error: bookingError } = await supabaseServer
      .from("bookings")
      .select("id, status, stripe_payment_intent_id")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Boeking niet gevonden." },
        { status: 404 }
      );
    }

    if (booking.status !== "pending") {
      return NextResponse.json(
        { error: "Deze boeking is al verwerkt." },
        { status: 400 }
      );
    }

    if (newStatus === "rejected") {
      if (!booking.stripe_payment_intent_id) {
        return NextResponse.json(
          { error: "Geen Stripe-betaling gevonden voor deze boeking." },
          { status: 400 }
        );
      }

      await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
      });
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
