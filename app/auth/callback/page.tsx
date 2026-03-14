"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Bezig met inloggen...");

  useEffect(() => {
    async function handleAuth() {
      const url = new URL(window.location.href);
      const code =
  url.searchParams.get("code") ||
  new URLSearchParams(window.location.hash.substring(1)).get("code");

      if (!code) {
        setMessage("Geen login-code gevonden.");
        return;
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setMessage("Login mislukt: " + error.message);
        return;
      }

      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: data.user.email,
          role: "guest",
        });
      }

      router.push("/account");
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

