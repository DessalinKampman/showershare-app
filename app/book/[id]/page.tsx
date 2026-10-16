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
  available: boolean;
};

type AvailabilitySlot = {
  id: string;
  shower_id: string;
  host_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
};

export default function BookPage() {
  const params = useParams();
  const id = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      setMessage("");

      const { data: listingData, error: listingError } = await supabase
        .from("listings")
        .select("id, title, city, address, price_per_use, available")
        .eq("id", id)
        .single();

      if (listingError || !listingData) {
        console.error("Listing error:", listingError);
        setMessage("Douchegegevens konden niet worden geladen.");
        setLoading(false);
        return;
      }

      if (!listingData.available) {
        setMessage("Deze douche is tijdelijk niet beschikbaar.");
        setListing(null);
        setLoading(false);
        return;
      }

      setListing(listingData);

      try {
        const response = await fetch(
          `/api/available-slots?showerId=${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Beschikbaarheid ophalen mislukt."
          );
        }

        setSlots(data.slots ?? []);
        setSelectedSlotId("");
      } catch (error) {
        console.error("Beschikbaarheid ophalen mislukt:", error);
        setMessage("Beschikbaarheid kon niet worden geladen.");
        setSlots([]);
      }

      setLoading(false);
    }

    if (id) {
      loadPage();
    }
  }, [id]);

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${date}T12:00:00`));
  }

  function formatTime(time: string) {
    return time.slice(0, 5);
  }

  async function handleBooking(e: React.FormEvent) {
    e.preventDefault();

    if (!listing) {
      setMessage("Douchegegevens konden niet worden geladen.");
      return;
    }

    if (!selectedSlotId) {
      setMessage("Kies eerst een beschikbaar moment.");
      return;
    }

    const selectedSlot = slots.find((slot) => slot.id === selectedSlotId);

    if (!selectedSlot) {
      setMessage("Het gekozen moment kon niet worden gevonden.");
      return;
    }

    const { data: currentListing, error: availabilityError } =
      await supabase
        .from("listings")
        .select("available")
        .eq("id", id)
        .single();

    if (availabilityError || !currentListing?.available) {
      setMessage("Deze douche is tijdelijk niet beschikbaar.");
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

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      const accessToken = sessionData.session?.access_token;

      if (sessionError || !accessToken) {
        throw new Error("Je sessie is verlopen. Log opnieuw in.");
      }

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: listing.title,
          price: listing.price_per_use,
          showerId: id,
          guestId: user.id,
          date: selectedSlot.slot_date,
          time: selectedSlot.start_time,
          availabilitySlotId: selectedSlot.id,
          endTime: selectedSlot.end_time,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(
          data.error || "Stripe Checkout kon niet worden gestart."
        );
      }

      window.location.href = data.url;
    } catch (error: unknown) {
      console.error(error);
      setMessage(
        "Betaling starten is mislukt: " +
          (error instanceof Error ? error.message : "Onbekende fout")
      );
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFAF7] px-6 py-16 text-[#17211C]">
        <div className="mx-auto max-w-2xl">
          <p>Beschikbaarheid laden...</p>
        </div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="min-h-screen bg-[#FAFAF7] px-6 py-16 text-[#17211C]">
        <div className="mx-auto max-w-2xl">
          <p>Deze douche kon niet worden gevonden.</p>

          <Link
            href="/search"
            className="mt-4 inline-block font-semibold underline"
          >
            Terug naar zoeken
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAF7] px-6 py-16 text-[#17211C]">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/shower/${listing.id}`}
          className="text-sm text-neutral-500 hover:text-black"
        >
          ← Terug naar douche
        </Link>

        <div className="mt-8 rounded-3xl border border-[#DDE5E0] bg-white p-8 shadow-sm">
          <p className="text-sm font-bold tracking-[0.22em] text-[#158A6A]">
            SHOWERSHARE
          </p>

          <h1 className="mt-2 text-3xl font-bold">Boek je douche</h1>

          <div className="mt-8 border-b border-[#E5E9E6] pb-6">
            <h2 className="text-xl font-semibold">{listing.title}</h2>

            <p className="mt-2 text-neutral-500">
              {listing.city}
              {listing.address ? ` · ${listing.address}` : ""}
            </p>

            <p className="mt-3 font-bold">
              €{Number(listing.price_per_use).toFixed(2).replace(".", ",")} per douche
            </p>
          </div>

          <form onSubmit={handleBooking} className="mt-7">
            <label
              htmlFor="availability"
              className="mb-3 block font-semibold"
            >
              Kies een beschikbaar moment
            </label>

            {slots.length > 0 ? (
              <select
                id="availability"
                value={selectedSlotId}
                onChange={(e) => {
                  setSelectedSlotId(e.target.value);
                  setMessage("");
                }}
                className="w-full rounded-xl border border-[#DDE5E0] bg-white px-4 py-4 outline-none focus:border-[#158A6A]"
                required
              >
                <option value="">Selecteer datum en tijd</option>

                {slots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {formatDate(slot.slot_date)} · {formatTime(slot.start_time)} –{" "}
                    {formatTime(slot.end_time)}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-xl bg-[#F4F7F6] p-4 text-neutral-500">
                Deze host heeft momenteel geen beschikbare momenten ingesteld.
              </div>
            )}

            <div className="mt-6 rounded-xl bg-[#F4F7F6] p-4">
              <div className="flex justify-between">
                <span>Douche</span>
                <span>
                  €{Number(listing.price_per_use).toFixed(2).replace(".", ",")}
                </span>
              </div>

              <div className="mt-2 flex justify-between font-bold">
                <span>Totaal</span>
                <span>
                  €{Number(listing.price_per_use).toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={booking || !selectedSlotId}
              className="mt-5 w-full rounded-xl bg-[#158A6A] px-5 py-4 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {booking ? "Betaling starten..." : "Doorgaan naar betalen"}
            </button>
          </form>

          {message && (
            <p className="mt-5 rounded-xl bg-[#F4F7F6] p-4">{message}</p>
          )}
        </div>
      </div>
    </main>
  );
}
