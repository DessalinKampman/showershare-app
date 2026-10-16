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
        { error: "Ongeldige sessie. Log opnieuw in." },
        { status: 401 }
      );
    }

    const user = data.user;

    // Controleer of deze gebruiker een host is.
    const { data: listing, error: listingError } =
      await supabaseServer
        .from("listings")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

    if (listingError) {
      throw listingError;
    }

    if (!listing) {
      return NextResponse.json(
        { error: "Maak eerst een doucheadvertentie aan." },
        { status: 403 }
      );
    }

    // Gebruik een bestaande Stripe-koppeling opnieuw.
    const { data: existing, error: lookupError } =
      await supabaseServer
        .from("host_payout_accounts")
        .select("stripe_account_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    if (existing) {
      return NextResponse.json({
        connected: true,
        created: false
      });
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "Geen e-mailadres bij je account gevonden." },
        { status: 400 }
      );
    }

    const stripe = new Stripe(
      process.env.STRIPE_SECRET_KEY!
    );

    const account = await stripe.accounts.create(
      {
        type: "express",
        country: "NL",
        email: user.email,
        metadata: {
          showershare_user_id: user.id
        }
      },
      {
        idempotencyKey: `showershare-connect-${user.id}`
      }
    );

    const { error: saveError } = await supabaseServer
      .from("host_payout_accounts")
      .upsert(
        {
          user_id: user.id,
          stripe_account_id: account.id
        },
        { onConflict: "user_id" }
      );

    if (saveError) {
      console.error("Connect-koppeling opslaan mislukt:", saveError);

      return NextResponse.json(
        { error: "Stripe-account kon niet worden gekoppeld." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      connected: true,
      created: true
    });
  } catch (error) {
    console.error("Stripe Connect fout:", error);

    return NextResponse.json(
      { error: "Stripe Connect kon niet worden gestart." },
      { status: 500 }
    );
  }
}
