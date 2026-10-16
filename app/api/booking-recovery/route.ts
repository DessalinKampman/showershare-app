import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import Stripe from "stripe";
import { confirmStripeBooking } from "@/lib/confirmStripeBooking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleRecovery(request: Request, applyChanges: boolean) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (
    !secret ||
    authorization !== `Bearer ${secret}`
  ) {
    return NextResponse.json(
      { error: "Geen toegang." },
      { status: 401 }
    );
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const cutoff = new Date(
      Date.now() - 45 * 60 * 1000
    ).toISOString();

    const { data: bookings, error } = await supabaseServer
      .from("bookings")
      .select("id, created_at, stripe_checkout_session_id")
      .eq("status", "pending")
      .lt("created_at", cutoff)
      .order("created_at", { ascending: true })
      .limit(25);

    if (error) throw error;

    const results = [];

    for (const booking of bookings ?? []) {
      if (!booking.stripe_checkout_session_id) {
        results.push({
          bookingId: booking.id,
          action: "manual_review",
          reason: "Geen Stripe Checkout-sessie gekoppeld",
        });
        continue;
      }

      try {
        const session = await stripe.checkout.sessions.retrieve(
          booking.stripe_checkout_session_id
        );

        let action = "manual_review";

        if (
          session.mode === "payment" &&
          session.status === "complete" &&
          session.payment_status === "paid"
        ) {
          try {
            if (applyChanges) {
              await confirmStripeBooking(session);
              action = "confirmed";
            } else {
              action = "confirm_after_verification";
            }
          } catch (confirmError) {
            console.error("Herstelbevestiging mislukt:", confirmError);
            action = "manual_review";
          }
        } else if (
          session.status === "expired" &&
          session.payment_status === "unpaid"
        ) {
          if (applyChanges) {
            if (
              session.id !== booking.stripe_checkout_session_id ||
              session.metadata?.bookingId !== booking.id
            ) {
              action = "manual_review";
            } else {
              const { data: cancelled, error: cancelError } =
                await supabaseServer
                  .from("bookings")
                  .update({ status: "cancelled" })
                  .eq("id", booking.id)
                  .eq("status", "pending")
                  .eq("stripe_checkout_session_id", session.id)
                  .select("id")
                  .maybeSingle();

              if (cancelError) {
                throw cancelError;
              }

              action = cancelled ? "cancelled" : "manual_review";
            }
          } else {
            action = "safe_to_cancel";
          }
        } else if (session.status === "open") {
          action = "still_open";
        }

        results.push({
          bookingId: booking.id,
          stripeStatus: session.status,
          paymentStatus: session.payment_status,
          action,
        });
      } catch (stripeError) {
        console.error("Stripe-herstelcontrole mislukt:", stripeError);

        results.push({
          bookingId: booking.id,
          action: "manual_review",
          reason: "Stripe-status kon niet worden gecontroleerd",
        });
      }
    }

    return NextResponse.json({
      checked: results.length,
      dryRun: !applyChanges,
      results,
    });
  } catch (error) {
    console.error("Booking recovery mislukt:", error);

    return NextResponse.json(
      { error: "Herstelcontrole mislukt." },
      { status: 500 }
    );
  }
}


export async function GET(request: Request) {
  return handleRecovery(request, false);
}

export async function POST(request: Request) {
  return handleRecovery(request, true);
}
