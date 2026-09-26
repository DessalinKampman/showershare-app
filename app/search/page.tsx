"use client";

import { useEffect, useState } from "react";
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

export default function SearchPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadListings() {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, description, city, address, price_per_use")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fout bij laden:", error);
      } else if (data) {
        setListings(data);
      }

      setLoading(false);
    }

    loadListings();
  }, []);

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-neutral-900">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight">Zoek douches</h1>

        <p className="mt-2 text-neutral-600">
          Bekijk beschikbare douches bij hosts in de buurt.
        </p>

        {loading ? (
          <p className="mt-8">Laden...</p>
        ) : listings.length === 0 ? (
          <p className="mt-8">Nog geen douches beschikbaar.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="rounded-2xl border p-5"
              >
                <h2 className="text-xl font-semibold">
                  {listing.title}
                </h2>

                <p className="mt-2 text-sm text-neutral-600">
                  {listing.description || "Geen beschrijving toegevoegd."}
                </p>

                <div className="mt-5 space-y-1 text-sm">
                  <p>
                    <strong>Stad:</strong> {listing.city}
                  </p>

                  <p>
                    <strong>Adres:</strong>{" "}
                    {listing.address || "Niet opgegeven"}
                  </p>

                  <p>
                    <strong>Prijs:</strong> €{listing.price_per_use} per douche
                  </p>
                </div>

                <Link
                  href={`/shower/${listing.id}`}
                  className="mt-5 inline-block rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Bekijk / boek
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
