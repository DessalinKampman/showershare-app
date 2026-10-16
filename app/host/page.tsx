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
    <main className="min-h-screen bg-white px-6 py-16 text-neutral-900">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Word host</h1>
        <p className="mt-2 text-neutral-600">
          Bied jouw douche aan op ShowerShare en verdien per boeking.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="text"
            placeholder="Titel, bijvoorbeeld: Warme douche vlakbij station"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none"
            required
          />

          <textarea
            placeholder="Beschrijving"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none"
            rows={4}
          />

          <input
            type="text"
            placeholder="Stad"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none"
            required
          />

          <input
            type="text"
            placeholder="Adres"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none"
          />

          <input
            type="number"
            placeholder="Prijs per douche"
            value={pricePerUse}
            onChange={(e) => setPricePerUse(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none"
            min="1"
            step="0.5"
            required
          />

      <div className="rounded-xl border border-dashed p-4">
        <label className="mb-2 block font-semibold">
          Foto&apos;s van je douche
        </label>

        <p className="mb-3 text-sm text-neutral-600">
          Voeg foto&apos;s toe zodat gasten kunnen zien wat ze boeken.
        </p>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setPhotos(Array.from(e.target.files || []))}
          className="w-full"
        />

        {photos.length > 0 && (
          <p className="mt-2 text-sm text-neutral-600">
            {photos.length} foto{photos.length === 1 ? "" : "'s"} geselecteerd
          </p>
        )}
      </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-black px-5 py-3 text-white font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Bezig..." : "Douche toevoegen"}
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
