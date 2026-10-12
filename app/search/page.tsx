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
  shower_photos?: { url: string; sort_order: number }[];
};

export default function SearchPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadListings() {
      const { data, error } = await supabase
        .from("listings")
          .select("id, title, description, city, address, price_per_use, shower_photos(url, sort_order)")
.eq("available", true)
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

  const filteredListings = listings.filter((listing) => {
    const term = search.toLowerCase();

    return (
      listing.title.toLowerCase().includes(term) ||
      listing.city.toLowerCase().includes(term) ||
      (listing.address || "").toLowerCase().includes(term)
    );
  });

  return (
    <main className="min-h-screen bg-[#F8FAF9] text-[#16211D]">
      {/* Navigatie */}
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#167D68] text-xl text-white">
              S
            </div>
            <span className="text-xl font-bold tracking-tight">ShowerShare</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/search"
              className="hidden rounded-full bg-[#E4F4EF] px-4 py-2 text-sm font-semibold text-[#126B59] sm:block"
            >
              Vind een douche
            </Link>

            <Link
              href="/host"
              className="hidden rounded-full px-4 py-2 text-sm font-medium hover:bg-[#F1F5F3] sm:block"
            >
              Word host
            </Link>

            <Link
              href="/account"
              className="rounded-full border border-[#DDE6E2] bg-white px-5 py-2.5 text-sm font-semibold hover:bg-[#F1F5F3]"
            >
              Mijn account
            </Link>
          </nav>
        </div>
      </header>

      {/* Intro + zoeken */}
      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex rounded-full bg-[#E4F4EF] px-4 py-2 text-sm font-semibold text-[#126B59]">
              🚿 Beschikbare douches
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Vind een douche
              <span className="block text-[#167D68]">bij jou in de buurt.</span>
            </h1>

            <p className="mt-4 max-w-xl text-lg leading-8 text-[#5C6B65]">
              Zoek een beschikbare douche, bekijk de details en boek eenvoudig
              een moment dat bij jou past.
            </p>
          </div>

          <div className="mt-8 flex max-w-3xl items-center rounded-2xl border border-[#DDE6E2] bg-white p-2 shadow-sm">
            <div className="pl-4 text-xl">⌕</div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek op stad, adres of douche..."
              className="w-full bg-transparent px-4 py-3 outline-none placeholder:text-[#8A9792]"
            />
            <div className="hidden rounded-xl bg-[#167D68] px-5 py-3 text-sm font-semibold text-white sm:block">
              Zoeken
            </div>
          </div>
        </div>
      </section>

      {/* Resultaten */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#167D68]">
              Beschikbaar
            </p>
            <h2 className="mt-1 text-2xl font-bold">
              Douches in de buurt
            </h2>
          </div>

          {!loading && (
            <p className="text-sm text-[#68756F]">
              {filteredListings.length}{" "}
              {filteredListings.length === 1 ? "douche" : "douches"}
            </p>
          )}
        </div>

        {loading ? (
          <div className="rounded-3xl border border-[#E1E8E5] bg-white p-8 text-[#68756F]">
            Douches laden...
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="rounded-3xl border border-[#E1E8E5] bg-white p-10 text-center">
            <div className="text-4xl">🚿</div>
            <h3 className="mt-4 text-xl font-bold">
              Geen douches gevonden
            </h3>
            <p className="mt-2 text-[#68756F]">
              Probeer een andere stad of zoekterm.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="overflow-hidden rounded-[28px] border border-[#E1E8E5] bg-white transition hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Tijdelijke foto-placeholder */}
                <div className="relative flex h-52 items-center justify-center bg-gradient-to-br from-[#DDF1EB] to-[#F3FAF7]">
                    {listing.shower_photos?.[0]?.url && (
                      <img
                        src={listing.shower_photos[0].url}
                        alt={`Foto van ${listing.title}`}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}

                  <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm ${listing.shower_photos?.[0]?.url ? "hidden" : ""}`}>
                    🚿
                  </div>

                  <div className="absolute left-5 top-5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm">
                    Beschikbaar
                  </div>

                  <div className="absolute right-5 top-5 rounded-full bg-[#167D68] px-3 py-1.5 text-sm font-bold text-white shadow-sm">
                    €{Number(listing.price_per_use).toFixed(2).replace(".", ",")}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold">{listing.title}</h3>
                      <p className="mt-1 text-sm font-medium text-[#167D68]">
                        📍 {listing.city}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-2 min-h-[48px] leading-6 text-[#68756F]">
                    {listing.description || "Een comfortabele douche beschikbaar om eenvoudig online te boeken."}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-[#53615B]">
                    <span className="rounded-full bg-[#F1F5F3] px-3 py-2">
                      🚿 Privé douche
                    </span>
                    <span className="rounded-full bg-[#F1F5F3] px-3 py-2">
                      ✓ Veilig boeken
                    </span>
                    <span className="rounded-full bg-[#F1F5F3] px-3 py-2">
                      ⚡ Direct bekijken
                    </span>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-[#EEF2F0] pt-5">
                    <div>
                      <p className="text-xs text-[#7A8782]">Vanaf</p>
                      <p className="text-xl font-bold">
                        €{Number(listing.price_per_use).toFixed(2).replace(".", ",")}
                        <span className="text-sm font-normal text-[#68756F]">
                          {" "}per douche
                        </span>
                      </p>
                    </div>

                    <Link
                      href={`/shower/${listing.id}`}
                      className="rounded-xl bg-[#16211D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#26352F]"
                    >
                      Bekijk douche →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-10 border-t border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-[#68756F] sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-[#16211D]">ShowerShare</span>
          <span>Vind een warme douche, waar je ook bent.</span>
        </div>
      </footer>
    </main>
  );
}
