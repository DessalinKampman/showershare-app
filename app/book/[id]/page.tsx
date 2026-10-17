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

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId);

  const price = Number(listing.price_per_use).toLocaleString("nl-NL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <main className="min-h-screen bg-[#F8FAF9] text-[#16211D]">
      <div className="border-b border-[#E4EAE7] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Shower<span className="text-[#168B80]">Share</span>
          </Link>

          <Link
            href={`/shower/${listing.id}`}
            className="rounded-full border border-[#E4EAE7] px-4 py-2 text-sm font-semibold hover:bg-[#F3F8F5]"
          >
            ← Terug naar douche
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#168B80]">
          Jouw reservering
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Tijd voor een frisse start.
        </h1>

        <p className="mt-4 max-w-2xl text-[#68756F]">
          Kies het moment dat jou uitkomt en bekijk je reservering
          voordat je doorgaat naar de betaling.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_370px] lg:items-start">
          <section className="rounded-[28px] border border-[#E1EAE5] bg-white p-6 shadow-sm sm:p-9">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E5F4EE] text-xl">
                🚿
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#168B80]">
                  Geselecteerde douche
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  {listing.title}
                </h2>

                <p className="mt-2 text-sm text-[#68756F]">
                  {listing.city}
                  {listing.address ? ` · ${listing.address}` : ""}
                </p>
              </div>
            </div>

            <div className="my-8 border-t border-[#E8EEEB]" />

            <form onSubmit={handleBooking}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#176D68] text-sm font-bold text-white">
                  1
                </span>
                <h2 className="text-xl font-bold">
                  Kies je douchemoment
                </h2>
              </div>

              <p className="mt-3 text-sm leading-7 text-[#68756F]">
                Hieronder staan de beschikbare momenten die de host
                heeft ingesteld.
              </p>

              {slots.length > 0 ? (
                <>
                  <label
                    htmlFor="availability"
                    className="mb-3 mt-7 block text-sm font-semibold"
                  >
                    Beschikbare datum en tijd
                  </label>

                  <select
                    id="availability"
                    value={selectedSlotId}
                    onChange={(e) => {
                      setSelectedSlotId(e.target.value);
                      setMessage("");
                    }}
                    required
                    disabled={booking}
                    className="w-full rounded-2xl border border-[#DCE8E2] bg-[#F8FAF9] px-4 py-4 text-[#16211D] outline-none focus:border-[#168B80] focus:ring-2 focus:ring-[#168B80]/10 disabled:opacity-50"
                  >
                    <option value="">Selecteer jouw moment</option>

                    {slots.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {formatDate(slot.slot_date)} ·{" "}
                        {formatTime(slot.start_time)} –{" "}
                        {formatTime(slot.end_time)}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <div className="mt-7 rounded-2xl border border-[#E1EAE5] bg-[#F3F8F5] p-6">
                  <p className="font-semibold">
                    Geen beschikbare momenten
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#68756F]">
                    Deze host heeft momenteel geen beschikbare
                    momenten ingesteld.
                  </p>
                </div>
              )}

              {selectedSlot && (
                <div className="mt-5 rounded-2xl border border-[#CBE9DE] bg-[#F1FAF5] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#168B80]">
                    Jouw gekozen moment
                  </p>

                  <p className="mt-2 font-bold">
                    {formatDate(selectedSlot.slot_date)}
                  </p>

                  <p className="mt-1 text-sm text-[#53615B]">
                    {formatTime(selectedSlot.start_time)} –{" "}
                    {formatTime(selectedSlot.end_time)}
                  </p>
                </div>
              )}

              <div className="my-8 border-t border-[#E8EEEB]" />

              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#176D68] text-sm font-bold text-white">
                  2
                </span>
                <h2 className="text-xl font-bold">
                  Rond je reservering af
                </h2>
              </div>

              <p className="mt-3 text-sm leading-7 text-[#68756F]">
                Na het kiezen van een moment ga je verder naar
                Stripe Checkout om je betaling af te ronden.
              </p>

              <button
                type="submit"
                disabled={booking || !selectedSlotId}
                className="mt-7 w-full rounded-2xl bg-[#176D68] px-6 py-4 text-center font-bold text-white transition hover:bg-[#115651] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {booking
                  ? "Betaling starten..."
                  : "Doorgaan naar betalen →"}
              </button>

              {message && (
                <p
                  role="alert"
                  className="mt-5 rounded-2xl bg-[#FFF5ED] p-4 text-sm text-[#87502E]"
                >
                  {message}
                </p>
              )}
            </form>
          </section>

          <aside className="rounded-[28px] border border-[#E1EAE5] bg-white p-7 shadow-lg shadow-[#176D68]/5 lg:sticky lg:top-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#168B80]">
              Jouw overzicht
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              Bijna tijd om op te frissen.
            </h2>

            <div className="mt-7 space-y-5 border-t border-[#E8EEEB] pt-6 text-sm">
              <div>
                <p className="text-[#68756F]">Douche</p>
                <p className="mt-1 font-bold">{listing.title}</p>
              </div>

              <div>
                <p className="text-[#68756F]">Locatie</p>
                <p className="mt-1 font-semibold">{listing.city}</p>
              </div>

              <div>
                <p className="text-[#68756F]">Datum en tijd</p>
                <p className="mt-1 font-semibold">
                  {selectedSlot
                    ? `${formatDate(selectedSlot.slot_date)} · ${formatTime(selectedSlot.start_time)} – ${formatTime(selectedSlot.end_time)}`
                    : "Nog niet geselecteerd"}
                </p>
              </div>
            </div>

            <div className="mt-7 border-t border-[#E8EEEB] pt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#68756F]">Douche</span>
                <span>€{price}</span>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#E8EEEB] pt-5">
                <span className="font-bold">Totaal</span>
                <span className="text-3xl font-bold">€{price}</span>
              </div>
            </div>

            <p className="mt-6 rounded-2xl bg-[#F3F8F5] p-4 text-xs leading-6 text-[#53615B]">
              Je betaalt pas wanneer je de betaling
              via Stripe Checkout afrondt.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
