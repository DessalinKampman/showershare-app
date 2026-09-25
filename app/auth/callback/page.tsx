"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Bezig met inloggen...");

  useEffect(() => {
    async function handleAuth() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            setMessage("Login mislukt: " + error.message);
            return;
          }

          router.replace("/account");
          return;
        }

        const hash = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            setMessage("Login mislukt: " + error.message);
            return;
          }

          router.replace("/account");
          return;
        }

        const { data } = await supabase.auth.getSession();

        if (data.session) {
          router.replace("/account");
          return;
        }

        setMessage("Geen geldige login-gegevens gevonden.");
      } catch (error) {
        setMessage("Er ging iets mis tijdens het inloggen.");
      }
    }

    handleAuth();
  }, [router]);

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-neutral-900">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">Inloggen...</h1>
        <p className="mt-4 text-neutral-600">{message}</p>
      </div>
    </main>
  );
}
