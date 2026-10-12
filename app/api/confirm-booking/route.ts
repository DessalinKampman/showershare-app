import { NextResponse } from "next/server";
import Stripe from "stripe";
import { confirmStripeBooking } from "@/lib/confirmStripeBooking";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();

    if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
      return NextResponse.json(
        { error: "Ongeldige Stripe Checkout Session." },
        { status: 400 }
      );
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      throw new Error("Stripe-configuratie ontbreekt.");
    }

    const stripe = new Stripe(stripeKey);

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const result = await confirmStripeBooking(session);

    return NextResponse.json({
      success: true,
      status: "confirmed",
      bookingId: result.bookingId,
      alreadyConfirmed: result.alreadyConfirmed,
    });
  } catch (error) {
    console.error("Bevestiging mislukt:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Onbekende fout bij boekingsbevestiging.",
      },
      { status: 400 }
    );
  }
}
