"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function HostPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [pricePerUse, setPricePerUse] = useState("5");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Je moet eerst ingelogd zijn.");
      setLoading(false);
      return;
    }

    const { data: newListing, error } = await supabase
    .from("listings")
    .insert({
      user_id: user.id,
      title,
      description,
      city,
      address,
      price_per_use: Number(pricePerUse),
    })
    .select("id")
    .single();

    if (error) {
      setMessage("Er ging iets mis: " + error.message);
    } else {
      if (newListing && photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          const extension = photo.name.split(".").pop() || "jpg";
          const filePath = `${newListing.id}/${Date.now()}-${i}.${extension}`;

          const { error: uploadError } = await supabase.storage
            .from("shower-photos")
            .upload(filePath, photo);

          if (uploadError) {
            setMessage("Douche toegevoegd, maar foto uploaden mislukte: " + uploadError.message);
            setLoading(false);
            return;
          }

          const { data: publicUrlData } = supabase.storage
            .from("shower-photos")
            .getPublicUrl(filePath);

          const { error: photoDbError } = await supabase
            .from("shower_photos")
            .insert({
              shower_id: newListing.id,
              url: publicUrlData.publicUrl,
              sort_order: i,
            });

          if (photoDbError) {
            setMessage("Foto geüpload, maar koppelen aan douche mislukte: " + photoDbError.message);
            setLoading(false);
            return;
          }
        }
      }

      setMessage("Je douche is toegevoegd.");
      setPhotos([]);
      setTitle("");
      setDescription("");
      setCity("");
      setAddress("");
      setPricePerUse("5");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#F8FAF9] text-[#16211D]">
      <div className="border-b border-[#E4EAE7] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <a href="/" className="text-xl font-bold tracking-tight">
            Shower<span className="text-[#168B80]">Share</span>
          </a>
          <a
            href="/host/dashboard"
            className="rounded-full border border-[#E4EAE7] px-5 py-2 text-sm font-semibold hover:bg-[#F3F8F5]"
          >
            Mijn dashboard →
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#168B80]">
          Word ShowerShare host
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Verdien met jouw douche.
        </h1>

        <p className="mt-4 max-w-2xl text-[#68756F]">
          Maak een mooie advertentie, stel jouw prijs in en laat reizigers
          eenvoudig een beschikbaar douchemoment boeken.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
          <section className="rounded-[28px] border border-[#E1EAE5] bg-white p-6 shadow-sm sm:p-9">
            <form onSubmit={handleSubmit} className="space-y-9">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#176D68] text-sm font-bold text-white">
                    1
                  </span>
                  <h2 className="text-xl font-bold">Vertel over jouw douche</h2>
                </div>

                <p className="mt-3 text-sm leading-6 text-[#68756F]">
                  Een duidelijke titel en beschrijving helpen gasten
                  jouw douche te vinden.
                </p>

                <div className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="host-title" className="mb-2 block text-sm font-semibold">
                      Titel van je advertentie *
                    </label>
                    <input
                      id="host-title"
                      type="text"
                      placeholder="Bijvoorbeeld: Warme douche vlak bij station"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-2xl border border-[#DDE6E2] bg-[#FBFDFC] px-4 py-4 outline-none focus:border-[#168B80]"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="host-description" className="mb-2 block text-sm font-semibold">
                      Beschrijving
                    </label>
                    <textarea
                      id="host-description"
                      placeholder="Vertel iets over je douche en wat gasten kunnen verwachten."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-2xl border border-[#DDE6E2] bg-[#FBFDFC] px-4 py-4 outline-none focus:border-[#168B80]"
                      rows={5}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E8EEEB] pt-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#176D68] text-sm font-bold text-white">
                    2
                  </span>
                  <h2 className="text-xl font-bold">Locatie en prijs</h2>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="host-city" className="mb-2 block text-sm font-semibold">
                      Stad *
                    </label>
                    <input
                      id="host-city"
                      type="text"
                      placeholder="Bijvoorbeeld: Groningen"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-2xl border border-[#DDE6E2] bg-[#FBFDFC] px-4 py-4 outline-none focus:border-[#168B80]"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="host-address" className="mb-2 block text-sm font-semibold">
                      Adres
                    </label>
                    <input
                      id="host-address"
                      type="text"
                      placeholder="Straat en huisnummer"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-2xl border border-[#DDE6E2] bg-[#FBFDFC] px-4 py-4 outline-none focus:border-[#168B80]"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label htmlFor="host-price" className="mb-2 block text-sm font-semibold">
                    Prijs per douche (€) *
                  </label>
                  <input
                    id="host-price"
                    type="number"
                    min="1"
                    step="0.5"
                    value={pricePerUse}
                    onChange={(e) => setPricePerUse(e.target.value)}
                    className="w-full rounded-2xl border border-[#DDE6E2] bg-[#FBFDFC] px-4 py-4 outline-none focus:border-[#168B80] sm:max-w-xs"
                    required
                  />
                  <p className="mt-2 text-xs text-[#68756F]">
                    Van elke boeking ontvang jij 75%. ShowerShare rekent 25% commissie.
                  </p>
                </div>
              </div>

              <div className="border-t border-[#E8EEEB] pt-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#176D68] text-sm font-bold text-white">
                    3
                  </span>
                  <h2 className="text-xl font-bold">Laat jouw douche zien</h2>
                </div>

                <p className="mt-3 text-sm leading-6 text-[#68756F]">
                  Upload duidelijke foto&apos;s zodat gasten kunnen zien
                  welke douche ze boeken.
                </p>

                <div className="mt-6 rounded-2xl border-2 border-dashed border-[#B9DCD0] bg-[#F3F8F5] p-6">
                  <label htmlFor="host-photos" className="mb-3 block font-semibold">
                    Foto&apos;s van je douche
                  </label>
                  <input
                    id="host-photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setPhotos(Array.from(e.target.files || []))}
                    className="block w-full text-sm text-[#53615B] file:mr-4 file:rounded-xl file:border-0 file:bg-[#176D68] file:px-4 file:py-3 file:font-semibold file:text-white"
                  />

                  {photos.length > 0 && (
                    <p className="mt-4 text-sm font-semibold text-[#176D68]">
                      ✓ {photos.length} foto{photos.length === 1 ? "" : "'s"} geselecteerd
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-[#E8EEEB] pt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#176D68] px-6 py-4 font-bold text-white transition hover:bg-[#115651] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Douche toevoegen..." : "Mijn douche toevoegen →"}
                </button>

                {message && (
                  <div
                    role="status"
                    className="mt-5 rounded-2xl border border-[#DDE6E2] bg-[#F3F8F5] p-4 text-sm text-[#53615B]"
                  >
                    {message}
                  </div>
                )}
              </div>
            </form>
          </section>

          <aside className="rounded-[28px] border border-[#E1EAE5] bg-white p-7 shadow-sm lg:sticky lg:top-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#168B80]">
              Zo werkt hosten
            </p>
            <h2 className="mt-3 text-2xl font-bold">
              Jouw douche. Jouw extra inkomsten.
            </h2>

            <div className="mt-7 space-y-6 text-sm">
              <div>
                <p className="font-bold">01 · Maak je advertentie</p>
                <p className="mt-2 leading-6 text-[#68756F]">
                  Vul je gegevens in en voeg foto&apos;s van jouw douche toe.
                </p>
              </div>
              <div>
                <p className="font-bold">02 · Stel tijden in</p>
                <p className="mt-2 leading-6 text-[#68756F]">
                  Via je dashboard beheer je wanneer gasten mogen boeken.
                </p>
              </div>
              <div>
                <p className="font-bold">03 · Ontvang reserveringen</p>
                <p className="mt-2 leading-6 text-[#68756F]">
                  Gasten boeken en betalen via ShowerShare.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-[#E5F4EE] p-5">
              <p className="text-sm font-semibold text-[#176D68]">
                Jouw opbrengst per boeking
              </p>
              <p className="mt-2 text-3xl font-bold">
                €{((Number(pricePerUse) || 0) * 0.75).toLocaleString("nl-NL", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="mt-2 text-xs leading-5 text-[#53615B]">
                Indicatief, bij een doucheprijs van €{(Number(pricePerUse) || 0).toLocaleString("nl-NL", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}, exclusief eventuele kosten of correcties.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
