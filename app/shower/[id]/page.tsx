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
  shower_photos?: { url: string; sort_order: number }[];
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
        .select(
          "id, title, description, city, address, price_per_use, shower_photos(url, sort_order)"
        )
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

    if (id) loadListing();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAF9] px-6 py-20">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-6 w-40 rounded bg-[#E4EEEB]" />
          <div className="mt-8 h-12 w-2/3 rounded bg-[#E4EEEB]" />
          <div className="mt-8 h-96 rounded-3xl bg-[#E4EEEB]" />
        </div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="min-h-screen bg-[#F8FAF9] px-6 py-20 text-[#16211D]">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold">Douche niet gevonden</h1>
          <p className="mt-3 text-[#68756F]">
            {error || "Deze douche bestaat niet."}
          </p>
          <Link
            href="/search"
            className="mt-8 inline-block rounded-xl bg-[#176D68] px-6 py-3 font-semibold text-white"
          >
            Terug naar zoeken
          </Link>
        </div>
      </main>
    );
  }

  const photos = [...(listing.shower_photos || [])]
    .filter((photo) => Boolean(photo.url))
    .sort((a, b) => a.sort_order - b.sort_order);

  const mainPhoto = photos[0]?.url || "/images/shower-hero.jpg";

  const formattedPrice = Number(listing.price_per_use).toLocaleString("nl-NL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <main className="min-h-screen bg-[#F8FAF9] text-[#16211D]">
      <header className="border-b border-[#E4EAE7] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Shower<span className="text-[#168B80]">Share</span>
          </Link>

          <Link
            href="/search"
            className="rounded-full border border-[#E4EAE7] px-5 py-2 text-sm font-semibold hover:bg-[#F1F5F3]"
          >
            ← Terug naar zoeken
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#168B80]">
            Ontdek jouw volgende douche
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {listing.title}
          </h1>

          <p className="mt-4 flex items-center gap-2 text-[#68756F]">
            <span className="text-[#168B80]">●</span>
            {listing.city}
          </p>
        </div>

        <section className="overflow-hidden rounded-[28px] border border-[#E1EAE5] bg-white p-3 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl md:col-span-2">
              <img
                src={mainPhoto}
                alt={`Douche: ${listing.title}`}
                className="h-72 w-full object-cover sm:h-96 md:h-[440px]"
              />
              <span className="absolute left-4 top-4 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#176D68] shadow-sm">
                Douche beschikbaar
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
              <img
                src={photos[1]?.url || mainPhoto}
                alt={`${listing.title} - extra foto`}
                className="h-36 w-full rounded-2xl object-cover sm:h-44 md:h-[214px]"
              />
              <img
                src={photos[2]?.url || mainPhoto}
                alt={`${listing.title} - extra foto`}
                className="h-36 w-full rounded-2xl object-cover sm:h-44 md:h-[214px]"
              />
            </div>
          </div>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="space-y-8">
            <section className="rounded-[28px] border border-[#E1EAE5] bg-white p-7 sm:p-9">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#168B80]">
                Over deze douche
              </p>

              <h2 className="mt-3 text-2xl font-bold">
                Even helemaal opfrissen.
              </h2>

              <p className="mt-5 whitespace-pre-line leading-8 text-[#68756F]">
                {listing.description ||
                  "Een fijne plek om je onderweg even op te frissen."}
              </p>

              <div className="mt-8 grid gap-4 border-t border-[#E8EEEB] pt-8 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#F3F8F5] p-5">
                  <p className="text-sm font-semibold">Locatie</p>
                  <p className="mt-2 text-sm text-[#68756F]">
                    {listing.city}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F3F8F5] p-5">
                  <p className="text-sm font-semibold">Adres</p>
                  <p className="mt-2 break-words text-sm text-[#68756F]">
                    {listing.address || "Niet opgegeven"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-[#E1EAE5] bg-white p-7 sm:p-9">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#168B80]">
                Zo werkt het
              </p>

              <h2 className="mt-3 text-2xl font-bold">
                In drie stappen weer fris.
              </h2>

              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                {[
                  ["01", "Kies je moment", "Bekijk de beschikbare tijden."],
                  ["02", "Boek veilig", "Rond je reservering online af."],
                  ["03", "Fris verder", "Geniet van jouw douche."],
                ].map(([number, title, description]) => (
                  <div
                    key={number}
                    className="rounded-2xl bg-[#F3F8F5] p-5"
                  >
                    <span className="text-sm font-bold text-[#168B80]">
                      {number}
                    </span>
                    <h3 className="mt-3 font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#68756F]">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="rounded-[28px] border border-[#E1EAE5] bg-white p-7 shadow-lg shadow-[#176D68]/5 lg:sticky lg:top-6">
            <p className="text-sm text-[#68756F]">Prijs per douche</p>

            <div className="mt-2 flex items-end gap-2">
              <span className="text-4xl font-bold tracking-tight">
                €{formattedPrice}
              </span>
              <span className="pb-1 text-sm text-[#68756F]">per keer</span>
            </div>

            <div className="mt-7 space-y-4 border-t border-[#E8EEEB] pt-6 text-sm text-[#53615B]">
              <p>✓ Duidelijke prijs</p>
              <p>✓ Eenvoudig reserveren</p>
              <p>✓ Veilig online betalen</p>
            </div>

            <Link
              href={`/book/${listing.id}`}
              className="mt-8 block rounded-2xl bg-[#176D68] px-6 py-4 text-center font-bold text-white transition hover:bg-[#115651]"
            >
              Bekijk tijden en boek →
            </Link>

            <p className="mt-4 text-center text-xs leading-5 text-[#68756F]">
              Kies eerst een beschikbaar moment voordat je betaalt.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
