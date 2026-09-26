"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Listing = {
  id: string;
  title: string;
  city: string;
  address: string | null;
  price_per_use: number;
};

export default function BookPage() {
  const params = useParams();
  const id = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    async function loadListing() {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, city, address, price_per_use")
        .eq("id", id)
        .single();

      if (!error && data) {
        setListing(data);
      }

      setLoading(false);
    }

    if (id) {
      loadListing();
    }
  }, [id]);

  async function handleBooking(e: React.FormEvent) {
    e.preventDefault();

    if (!date || !time) {
      setMessage("Kies eerst een datum en tijd.");
      return;
    }

    setBooking(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Je moet ingelogd zijn om een douche te boeken.");
      setBooking(false);
      return;
    }

    const { error } = await supabase.from("bookings").insert({
      listing_id: id,
      guest_id: user.id,
      booking_date: date,
      booking_time: time,
    });

    if (error) {
      console.error(error);
      setMessage("Boeking opslaan is mislukt: " + error.message);
      setBooking(false);
      return;
    }

    setMessage("Boeking succesvol geplaatst!");
    setBooking(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white p-6 py-16 text-neutral-900">
        <div className="mx-auto max-w-2xl">
          <p>Laden...</p>
        </div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="min-h-screen bg-white p-6 py-16 text-neutral-900">
        <div className="mx-auto max-w-2xl">
          <p>Deze douche kon niet worden gevonden.</p>

          <Link
            href="/search"
            className="mt-4 inline-block underline"
          >
            Terug naar zoeken
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-6 py-16 text-neutral-900">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/shower/${listing.id}`}
          className="text-sm text-neutral-600 hover:text-black"
        >
          ← Terug naar douche
        </Link>

        <div className="mt-8 rounded-2xl border p-8">
          <h1 className="text-3xl font-bold">Boek je douche</h1>

          <div className="mt-6 border-b pb-6">
            <h2 className="text-xl font-semibold">{listing.title}</h2>

            <p className="mt-2 text-neutral-600">
              {listing.city}
              {listing.address ? ` · ${listing.address}` : ""}
            </p>

            <p className="mt-2 font-semibold">
              €{listing.price_per_use} per douche
            </p>
          </div>

          <form onSubmit={handleBooking} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block font-semibold">
                Datum
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Tijd
              </label>

              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                required
              />
            </div>

            <div className="rounded-xl bg-neutral-100 p-4">
              <div className="flex justify-between">
                <span>Douche</span>
                <span>€{listing.price_per_use}</span>
              </div>

              <div className="mt-2 flex justify-between font-bold">
                <span>Totaal</span>
                <span>€{listing.price_per_use}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={booking}
              className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {booking ? "Boeking plaatsen..." : "Doorgaan met boeken"}
            </button>
          </form>

          {message && (
            <p className="mt-5 rounded-xl bg-neutral-100 p-4">
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
