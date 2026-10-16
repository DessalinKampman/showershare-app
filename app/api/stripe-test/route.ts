import Stripe from "stripe";

export async function GET() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    await stripe.balance.retrieve();

    return Response.json({
      connected: true,
      message: "Stripe Sandbox verbinding werkt",
    });
  } catch (error: unknown) {
    return Response.json(
      {
        connected: false,
        message: error instanceof Error ? error.message : "Onbekende fout",
      },
      { status: 500 }
    );
  }
}
