"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Listing = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  address: string | null;
  price_per_use: number;
};

export default function ShowerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadListing() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, description, city, address, price_per_use")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        setError("Deze douche kon niet worden gevonden.");
        setListing(null);
      } else {
        setListing(data);
      }

      setLoading(false);
    }

    if (id) {
      loadListing();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-16 text-neutral-900">
        <div className="mx-auto max-w-3xl">
          <p>Laden...</p>
        </div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="min-h-screen bg-white px-6 py-16 text-neutral-900">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold">Douche niet gevonden</h1>
          <p className="mt-3 text-neutral-600">
            {error || "Deze douche bestaat niet."}
          </p>

          <Link
            href="/search"
            className="mt-6 inline-block rounded-xl bg-black px-5 py-3 font-semibold text-white"
          >
            Terug naar zoeken
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-neutral-900">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/search"
          className="text-sm font-medium text-neutral-600 hover:text-black"
        >
          ← Terug naar zoeken
        </Link>

        <div className="mt-6 rounded-2xl border p-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {listing.title}
          </h1>

          <p className="mt-4 text-neutral-600">
            {listing.description || "Geen beschrijving toegevoegd."}
          </p>

          <div className="mt-8 space-y-2">
            <p>
              <strong>Stad:</strong> {listing.city}
            </p>

            <p>
              <strong>Adres:</strong>{" "}
              {listing.address || "Niet opgegeven"}
            </p>

            <p className="text-lg">
              <strong>Prijs:</strong> €{listing.price_per_use} per douche
            </p>
          </div>

          <button
            type="button"
            className="mt-8 rounded-xl bg-black px-6 py-3 font-semibold text-white hover:opacity-90"
          >
            <Link
  href={`/book/${listing.id}`}
  className="mt-8 inline-block rounded-xl bg-black px-6 py-3 font-semibold text-white hover:opacity-90"
>
  Boek deze douche
</Link>Boek deze douche
          </button>
        </div>
      </div>
    </main>
  );
}
