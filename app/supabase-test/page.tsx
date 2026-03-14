"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SupabaseTestPage() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    async function run() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setStatus(
          data.session
            ? "✅ Connected (session found)"
            : "✅ Connected (no session yet)"
        );
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        setStatus("❌ Error: " + message);
      }
    }
    run();
  }, []);

  return (
    <main className="min-h-screen bg-white text-neutral-900 p-10">
      <h1 className="text-2xl font-bold">Supabase connection test</h1>
      <p className="mt-4">{status}</p>
      <p className="mt-2 text-sm text-neutral-600">
        Als je hier ✅ ziet, staan je keys + client goed.
      </p>
    </main>
  );
}