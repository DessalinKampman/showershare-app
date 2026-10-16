import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabaseServer";

export async function confirmStripeBooking(
  session: Stripe.Checkout.Session
) {
  if (
    session.mode !== "payment" ||
    session.status !== "complete" ||
    session.payment_status !== "paid"
  ) {
    throw new Error("Stripe-betaling is niet voltooid.");
  }

  const bookingId = session.metadata?.bookingId;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (
    !bookingId ||
    !paymentIntentId ||
    session.amount_total == null ||
    session.currency?.toLowerCase() !== "eur"
  ) {
    throw new Error("Stripe-betaalgegevens zijn onvolledig.");
  }

  const { data: booking, error: lookupError } = await supabaseServer
    .from("bookings")
    .select("id, shower_id, guest_id, subtotal_cents, status, stripe_checkout_session_id, stripe_payment_intent_id")
    .eq("id", bookingId)
    .single();

  if (lookupError || !booking) {
    throw new Error("Bijbehorende reservering niet gevonden.");
  }
if (
  !booking.stripe_checkout_session_id ||
  booking.stripe_checkout_session_id !== session.id
) {
  throw new Error(
    "Stripe Checkout-sessie komt niet overeen met de reservering."
  );
}
  if (
    booking.shower_id !== session.metadata?.showerId ||
    booking.guest_id !== session.metadata?.guestId ||
    booking.subtotal_cents !== session.amount_total
  ) {
    throw new Error("Stripe-gegevens komen niet overeen met de reservering.");
  }

  if (booking.status === "confirmed") {
    if (booking.stripe_payment_intent_id !== paymentIntentId) {
      throw new Error("Reservering is al bevestigd met andere betaalgegevens.");
    }

    return { bookingId, alreadyConfirmed: true };
  }

  if (booking.status !== "pending") {
    throw new Error("Reservering kan niet worden bevestigd.");
  }

  if (
    booking.stripe_payment_intent_id &&
    booking.stripe_payment_intent_id !== paymentIntentId
  ) {
    throw new Error("Reservering is gekoppeld aan een andere betaling.");
  }

  const { data: updated, error: updateError } = await supabaseServer
    .from("bookings")
    .update({
      status: "confirmed",
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq("id", bookingId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw new Error("Bevestigen mislukt: " + updateError.message);
  }

  if (!updated) {
    const { data: latest, error: latestError } = await supabaseServer
      .from("bookings")
      .select("status, stripe_payment_intent_id")
      .eq("id", bookingId)
      .single();

    if (
      !latestError &&
      latest?.status === "confirmed" &&
      latest?.stripe_payment_intent_id === paymentIntentId
    ) {
      return { bookingId, alreadyConfirmed: true };
    }

    throw new Error("Reservering is ondertussen gewijzigd. Controle vereist.");
  }

  return { bookingId, alreadyConfirmed: false };
}
