"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage("Er ging iets mis: " + error.message);
    } else {
      setMessage("Check je e-mail voor de magic link.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-neutral-900">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">Inloggen</h1>
        <p className="mt-2 text-neutral-600">
          Vul je e-mailadres in en ontvang een magic link om in te loggen.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="jij@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-5 py-3 text-white font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Bezig..." : "Stuur magic link"}
          </button>
        </form>

        {message && (
          <div className="mt-4 rounded-xl border p-4 text-sm text-neutral-700">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}
