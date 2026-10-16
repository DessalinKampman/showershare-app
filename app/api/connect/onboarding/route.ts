import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");

    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn." },
        { status: 401 }
      );
    }

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error: authError } =
      await supabaseAuth.auth.getUser(token);

    if (authError || !data.user) {
      return NextResponse.json(
        { error: "Je sessie is ongeldig. Log opnieuw in." },
        { status: 401 }
      );
    }

    const user = data.user;

    const { data: listing, error: listingError } =
      await supabaseServer
        .from("listings")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

    if (listingError) throw listingError;

    if (!listing) {
      return NextResponse.json(
        { error: "Maak eerst een doucheadvertentie aan." },
        { status: 403 }
      );
    }

    const { data: payoutAccount, error: lookupError } =
      await supabaseServer
        .from("host_payout_accounts")
        .select("stripe_account_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (lookupError) throw lookupError;

    if (!payoutAccount) {
      return NextResponse.json(
        { error: "Maak eerst een Stripe Connect-account aan." },
        { status: 404 }
      );
    }

    const stripe = new Stripe(
      process.env.STRIPE_SECRET_KEY!
    );

    const account = await stripe.accounts.retrieve(
      payoutAccount.stripe_account_id
    );

    if (account.details_submitted && account.payouts_enabled) {
      return NextResponse.json({
        onboardingComplete: true
      });
    }

    const origin = new URL(request.url).origin;

    const accountLink = await stripe.accountLinks.create({
      account: payoutAccount.stripe_account_id,
      refresh_url: `${origin}/host/dashboard`,
      return_url: `${origin}/host/dashboard`,
      type: "account_onboarding"
    });

    return NextResponse.json({
      onboardingComplete: false,
      url: accountLink.url
    });
  } catch (error) {
    console.error("Stripe onboarding fout:", error);

    return NextResponse.json(
      { error: "De Stripe-onboarding kon niet worden gestart." },
      { status: 500 }
    );
  }
}
