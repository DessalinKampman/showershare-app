"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Listing = {
  id: string;
  title: string;
  city: string;
  address: string;
};

type AvailabilitySlot = {
  id: string;
  shower_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  listing?: Listing;
};

export default function AvailabilityPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedShower, setSelectedShower] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [hostId, setHostId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAvailability() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Je moet ingelogd zijn.");
      setLoading(false);
      return;
    }

    setHostId(user.id);

    const { data: listingData } = await supabase
      .from("listings")
      .select("id, title, city, address")
      .eq("user_id", user.id);

    const hostListings = listingData || [];
    setListings(hostListings);

    if (hostListings.length > 0 && !selectedShower) {
      setSelectedShower(hostListings[0].id);
    }

    const { data: slotData } = await supabase
      .from("availability_slots")
      .select("id, shower_id, slot_date, start_time, end_time")
      .eq("host_id", user.id)
      .order("slot_date", { ascending: true })
      .order("start_time", { ascending: true });

    const rawSlots = slotData || [];

    const combined = rawSlots.map((slot) => ({
      ...slot,
      listing: hostListings.find(
        (listing) => listing.id === slot.shower_id
      ),
    }));

    setSlots(combined);
    setLoading(false);
  }

  useEffect(() => {
    loadAvailability();
  }, []);

  async function addSlot() {
    setMessage("");

    if (!selectedShower || !date || !startTime || !endTime) {
      setMessage("Vul alle velden in.");
      return;
    }

    if (endTime <= startTime) {
      setMessage("De eindtijd moet later zijn dan de begintijd.");
      return;
    }

    const { error } = await supabase.from("availability_slots").insert({
      shower_id: selectedShower,
      host_id: hostId,
      slot_date: date,
      start_time: startTime,
      end_time: endTime,
    });

    if (error) {
      console.error(error);
      setMessage("Beschikbaarheid opslaan is mislukt: " + error.message);
      return;
    }

    setMessage("Beschikbaarheid toegevoegd.");
    setDate("");
    setStartTime("");
    setEndTime("");
    await loadAvailability();
  }

  async function deleteSlot(id: string) {
    const { error } = await supabase
      .from("availability_slots")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage("Verwijderen is mislukt: " + error.message);
      return;
    }

    setMessage("Tijdslot verwijderd.");
    await loadAvailability();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAF9] p-10 text-[#17221D]">
        Laden...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAF9] text-[#17221D]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 font-semibold uppercase tracking-[0.2em] text-[#168568]">
              ShowerShare Host
            </p>

            <h1 className="text-4xl font-bold">
              Mijn beschikbaarheid
            </h1>

            <p className="mt-2 text-[#68756F]">
              Geef aan wanneer gasten jouw douche kunnen reserveren.
            </p>
          </div>

          <Link
            href="/host/dashboard"
            className="rounded-xl border border-[#D6DEDA] bg-white px-5 py-3 font-semibold"
          >
            Terug naar dashboard
          </Link>
        </div>

        <section className="rounded-3xl border border-[#DDE6E2] bg-white p-7">
          <h2 className="text-2xl font-bold">
            Beschikbaarheid toevoegen
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block font-semibold">
                Douche
              </label>

              <select
                value={selectedShower}
                onChange={(e) => setSelectedShower(e.target.value)}
                className="w-full rounded-xl border border-[#D6DEDA] bg-white p-3"
              >
                {listings.map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {listing.title} – {listing.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Datum
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-[#D6DEDA] p-3"
              />
            </div>

            <div />

            <div>
              <label className="mb-2 block font-semibold">
                Begintijd
              </label>

              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-[#D6DEDA] p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Eindtijd
              </label>

              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-[#D6DEDA] p-3"
              />
            </div>
          </div>

          <button
            onClick={addSlot}
            className="mt-6 rounded-xl bg-[#168568] px-6 py-3 font-semibold text-white"
          >
            Beschikbaarheid toevoegen
          </button>

          {message && (
            <p className="mt-4 font-medium text-[#68756F]">
              {message}
            </p>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">
            Mijn beschikbare momenten
          </h2>

          {slots.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-[#DDE6E2] bg-white p-7">
              <p className="font-semibold">
                Nog geen beschikbaarheid ingesteld.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[#DDE6E2] bg-white p-6"
                >
                  <div>
                    <p className="font-bold">
                      {slot.listing?.title || "Douche"}
                    </p>

                    <p className="mt-1 text-[#68756F]">
                      {slot.slot_date} · {slot.start_time.slice(0, 5)} –{" "}
                      {slot.end_time.slice(0, 5)}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteSlot(slot.id)}
                    className="rounded-xl border border-[#D6DEDA] px-4 py-2 font-semibold"
                  >
                    Verwijderen
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
