import Stripe from "stripe";
import { confirmStripeBooking } from "@/lib/confirmStripeBooking";
import { supabaseServer } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const signature = request.headers.get("stripe-signature");

  if (!secret || !stripeKey || !signature) {
    return NextResponse.json(
      { error: "Webhookconfiguratie ontbreekt." },
      { status: 400 }
    );
  }

  const stripe = new Stripe(stripeKey);

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json(
      { error: "Ongeldige webhookhandtekening." },
      { status: 400 }
    );
  }

  console.log("Stripe-webhook ontvangen:", event.type);

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === "paid") {
      try {
        const result = await confirmStripeBooking(session);
        console.log("Boeking bevestigd:", result.bookingId);
      } catch (error) {
        console.error("Stripe-boekingsbevestiging mislukt:", error);

        return NextResponse.json(
          { error: "Boekingsbevestiging mislukt." },
          { status: 500 }
        );
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;

    if (bookingId && session.payment_status === "unpaid") {
      const { error } = await supabaseServer
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId)
        .eq("status", "pending");

      if (error) {
        console.error("Verlopen boeking annuleren mislukt:", error);
        return NextResponse.json(
          { error: "Vrijgeven tijdslot mislukt." },
          { status: 500 }
        );
      }

      console.log("Verlopen tijdslot vrijgegeven:", bookingId);
    }
  }

  return NextResponse.json({ received: true });
}
