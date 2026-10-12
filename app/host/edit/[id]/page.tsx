"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Listing = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  city: string;
  address: string | null;
  price_per_use: number;
};

export default function EditShowerPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [authorized, setAuthorized] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");

  const [photos, setPhotos] = useState<
    { id: string; url: string; sort_order: number }[]
  >([]);
  const [photoError, setPhotoError] = useState("");
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [settingCoverId, setSettingCoverId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);


  useEffect(() => {
    async function loadListing() {
      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError || !user) {
        setMessage("Log eerst in om je advertentie te beheren.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("listings")
        .select("id, user_id, title, description, city, address, price_per_use")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        setMessage("Advertentie niet gevonden of geen toegang.");
        setLoading(false);
        return;
      }

      const listing = data as Listing;

      setTitle(listing.title);
      setDescription(listing.description || "");
      setCity(listing.city);
      setAddress(listing.address || "");
      setPrice(String(listing.price_per_use));

      const { data: photoData, error: photosError } = await supabase
        .from("shower_photos")
        .select("id, url, sort_order")
        .eq("shower_id", id)
        .order("sort_order", { ascending: true });

      if (photosError) {
        setPhotoError("Foto's laden mislukt: " + photosError.message);
      } else {
        setPhotos(photoData || []);
      }

      setAuthorized(true);
      setLoading(false);
    }

    loadListing();
  }, [id]);


  async function handlePhotoUpload() {
    if (!authorized || uploading || newPhotos.length === 0) return;

    setUploading(true);
    setPhotoError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setPhotoError("Log eerst opnieuw in.");
        return;
      }

      const { data: listing } = await supabase
        .from("listings")
        .select("id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (!listing) {
        setPhotoError("Geen toegang tot deze douche.");
        return;
      }

      for (const file of newPhotos) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "";

        if (["heic", "heif"].includes(extension)) {
          setPhotoError(
            "HEIC wordt nog niet ondersteund. Kies voorlopig een JPG- of PNG-foto."
          );
          return;
        }

        if (!["jpg", "jpeg", "png", "webp"].includes(extension)) {
          setPhotoError("Alleen JPG, PNG en WebP zijn toegestaan.");
          return;
        }


        const filePath = `${id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("shower-photos")
          .upload(filePath, file);

        if (uploadError) {
          setPhotoError("Upload mislukt: " + uploadError.message);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("shower-photos")
          .getPublicUrl(filePath);

        const { error: insertError } = await supabase
          .from("shower_photos")
          .insert({
            shower_id: id,
            url: urlData.publicUrl,
            sort_order: photos.length,
          });

        if (insertError) {
          setPhotoError("Foto koppelen mislukt: " + insertError.message);
          return;
        }
      }

      const { data: updatedPhotos, error: loadError } = await supabase
        .from("shower_photos")
        .select("id, url, sort_order")
        .eq("shower_id", id)
        .order("sort_order", { ascending: true });

      if (loadError) {
        setPhotoError("Foto's vernieuwen mislukt: " + loadError.message);
        return;
      }

      setPhotos(updatedPhotos || []);
      setNewPhotos([]);
      setPhotoError("Foto's succesvol toegevoegd!");

    } catch {
      setPhotoError("Er is een onverwachte fout opgetreden.");
    } finally {
      setUploading(false);
    }
  }



  async function handlePhotoDelete(photo: { id: string; url: string }) {
    if (!authorized || deletingPhotoId) return;

    const confirmed = window.confirm(
      "Weet je zeker dat je deze foto definitief wilt verwijderen?"
    );

    if (!confirmed) return;

    setDeletingPhotoId(photo.id);
    setPhotoError("");

    try {
      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Log opnieuw in.");
      }

      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .select("id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (listingError || !listing) {
        throw new Error("Geen toegang tot deze douche.");
      }

      const prefix = supabase.storage
        .from("shower-photos")
        .getPublicUrl("")
        .data.publicUrl.split("?")[0].replace(/\/$/, "");

      if (!photo.url.startsWith(prefix + "/")) {
        throw new Error("Onbekende foto-URL. Verwijderen gestopt.");
      }

      const filePath = decodeURIComponent(
        photo.url.substring(prefix.length + 1).split("?")[0]
      );

      if (!filePath.startsWith(id + "/") || filePath.includes("..")) {
        throw new Error("Foto behoort niet tot deze douche.");
      }

      const { data: photoRow, error: photoLookupError } = await supabase
        .from("shower_photos")
        .select("id")
        .eq("id", photo.id)
        .eq("shower_id", id)
        .single();

      if (photoLookupError || !photoRow) {
        throw new Error("Fotovermelding niet gevonden.");
      }

      const { error: storageError } = await supabase.storage
        .from("shower-photos")
        .remove([filePath]);

      if (storageError) {
        throw new Error("Bestand verwijderen mislukt: " + storageError.message);
      }

      const { data: deletedRow, error: dbError } = await supabase
        .from("shower_photos")
        .delete()
        .eq("id", photo.id)
        .eq("shower_id", id)
        .select("id")
        .single();

      if (dbError || !deletedRow) {
        throw new Error(
          "Bestand verwijderd, maar database bijwerken mislukt: " +
          (dbError?.message || "Geen verwijderde rij ontvangen")
        );
      }

      setPhotos(current => current.filter(item => item.id !== photo.id));
      setPhotoError("Foto succesvol verwijderd!");
    } catch (error) {
      setPhotoError(
        error instanceof Error ? error.message : "Verwijderen mislukt."
      );
    } finally {
      setDeletingPhotoId(null);
    }
  }


  async function handleSetCoverPhoto(photoId: string) {
    if (!authorized || settingCoverId || deletingPhotoId) return;

    setSettingCoverId(photoId);
    setPhotoError("");

    try {
      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Log opnieuw in.");
      }

      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .select("id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (listingError || !listing) {
        throw new Error("Geen toegang tot deze douche.");
      }

      const { data: currentPhotos, error: fetchError } = await supabase
        .from("shower_photos")
        .select("id, url, sort_order")
        .eq("shower_id", id)
        .order("sort_order", { ascending: true });

      if (fetchError || !currentPhotos) {
        throw new Error(fetchError?.message || "Foto's ophalen mislukt.");
      }

      const selectedPhoto = currentPhotos.find(p => p.id === photoId);

      if (!selectedPhoto) {
        throw new Error("Foto niet gevonden.");
      }

      const lowestOrder = Math.min(
        ...currentPhotos.map(p => p.sort_order)
      );

      if (selectedPhoto.sort_order !== lowestOrder) {
        const { data: updated, error: updateError } = await supabase
          .from("shower_photos")
          .update({ sort_order: lowestOrder - 1 })
          .eq("id", photoId)
          .eq("shower_id", id)
          .select("id");

        if (updateError || !updated?.length) {
          throw new Error(
            updateError?.message || "Hoofdfoto wijzigen mislukt."
          );
        }
      }

      const { data: refreshed, error: refreshError } = await supabase
        .from("shower_photos")
        .select("id, url, sort_order")
        .eq("shower_id", id)
        .order("sort_order", { ascending: true });

      if (refreshError) {
        throw new Error(refreshError.message);
      }

      setPhotos(refreshed || []);
      setPhotoError("Hoofdfoto succesvol gewijzigd!");
    } catch (error) {
      setPhotoError(
        error instanceof Error ? error.message : "Wijzigen mislukt."
      );
    } finally {
      setSettingCoverId(null);
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!authorized || saving) return;

    const amount = Number(price);

    if (!title.trim() || !city.trim() ||
        !Number.isFinite(amount) || amount < 0.5) {
      setMessage("Vul een titel, stad en geldige prijs in (minimaal €0,50).");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError || !user) {
        setMessage("Je moet opnieuw inloggen.");
        return;
      }

      const { data, error } = await supabase
        .from("listings")
        .update({
          title: title.trim(),
          description: description.trim(),
          city: city.trim(),
          address: address.trim(),
          price_per_use: amount,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select("id")
        .single();

      if (error || !data) {
        setMessage("Opslaan mislukt: " +
          (error?.message || "Geen toegang of advertentie niet gevonden."));
        return;
      }

      setMessage("Advertentie succesvol bijgewerkt!");
    } catch {
      setMessage("Er is een onverwachte fout opgetreden.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#DDE6E2] bg-white px-4 py-3 outline-none focus:border-[#168568]";

  return (
    <main className="min-h-screen bg-[#F8FAF9] px-6 py-12 text-[#16211D]">
      <div className="mx-auto max-w-2xl">
        <Link href="/host/dashboard"
          className="text-sm font-semibold text-[#168568]">
          ← Terug naar hostdashboard
        </Link>

        <h1 className="mt-8 text-3xl font-bold">
          Advertentie bewerken
        </h1>
        <p className="mt-2 text-neutral-600">
          Werk de gegevens van je douche bij.
        </p>

        {loading ? (
          <p className="mt-8">Advertentie laden...</p>
        ) : !authorized ? (
          <p className="mt-8">{message}</p>
        ) : (
          <form onSubmit={handleSave}
            className="mt-8 space-y-5 rounded-3xl border border-[#DDE6E2] bg-white p-6 sm:p-8">

            <div>
              <label className="mb-2 block font-semibold">Titel</label>
              <input className={inputClass} value={title}
                onChange={e => setTitle(e.target.value)} required />
            </div>

            <div>
              <label className="mb-2 block font-semibold">Beschrijving</label>
              <textarea className={inputClass} value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4} />
            </div>

            <div>
              <label className="mb-2 block font-semibold">Stad</label>
              <input className={inputClass} value={city}
                onChange={e => setCity(e.target.value)} required />
            </div>

            <div>
              <label className="mb-2 block font-semibold">Adres</label>
              <input className={inputClass} value={address}
                onChange={e => setAddress(e.target.value)} />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Prijs per douche (€)
              </label>
              <input className={inputClass} type="number"
                min="0.5" step="0.5" value={price}
                onChange={e => setPrice(e.target.value)} required />
            </div>


            <div className="rounded-2xl border border-[#DDE6E2] p-5">
              <h2 className="text-xl font-bold">Foto's van je douche</h2>
              <p className="mt-2 text-sm text-neutral-600">
                Beheer hier de foto's die gasten kunnen bekijken.
              </p>

              {photoError && (
                <p className="mt-3 text-sm text-red-600">{photoError}</p>
              )}


              <div className="mt-4 space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e =>
                    setNewPhotos(Array.from(e.target.files || []))
                  }
                  className="w-full text-sm"
                />
                <button
                  type="button"
                  onClick={handlePhotoUpload}
                  disabled={uploading || newPhotos.length === 0}
                  className="rounded-xl bg-[#168568] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {uploading ? "Foto's uploaden..." : "Nieuwe foto's toevoegen"}
                </button>
              </div>

              {photos.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-500">
                  Nog geen foto's toegevoegd.
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((photo, index) => (
                    <div key={photo.id} className="overflow-hidden rounded-xl border">
                      <img
                        src={photo.url}
                        alt={`Douchefoto ${index + 1}`}
                        className="h-36 w-full object-cover"
                      />
                      <p className="p-2 text-xs text-neutral-600">
                        {index === 0 ? "Hoofdfoto" : `Foto ${index + 1}`}
                      </p>

                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetCoverPhoto(photo.id)}
                          disabled={settingCoverId !== null || deletingPhotoId !== null}
                          className="mx-2 mb-2 rounded-lg bg-[#168568] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {settingCoverId === photo.id
                            ? "Instellen..."
                            : "Instellen als hoofdfoto"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePhotoDelete(photo)}
                        disabled={deletingPhotoId !== null}
                        className="mx-2 mb-3 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingPhotoId === photo.id
                          ? "Verwijderen..."
                          : "Foto verwijderen"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={saving}
              className="w-full rounded-xl bg-[#168568] px-5 py-4 font-semibold text-white disabled:opacity-50">
              {saving ? "Opslaan..." : "Wijzigingen opslaan"}
            </button>

            {message && (
              <p className="rounded-xl bg-[#F1F5F3] p-4 text-sm">
                {message}
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
