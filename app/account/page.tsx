"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
};

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState("Laden...");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus("Niet ingelogd");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        setStatus("Fout bij ophalen profiel");
        return;
      }

      setProfile(data);
      setStatus("Geladen");
    }

    loadProfile();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-neutral-900">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Mijn account</h1>

        <div className="mt-8 rounded-2xl border p-6">
          {profile ? (
            <div className="space-y-3">
              <p>
                <strong>E-mail:</strong> {profile.email}
              </p>
              <p>
                <strong>Rol:</strong> {profile.role}
              </p>
              <p>
                <strong>Naam:</strong> {profile.full_name || "Nog niet ingevuld"}
              </p>

              <button
                onClick={handleLogout}
                className="mt-4 rounded-xl bg-black px-5 py-3 text-white font-semibold hover:opacity-90"
              >
                Uitloggen
              </button>
            </div>
          ) : (
            <p>{status}</p>
          )}
        </div>
      </div>
    </main>
  );
}