"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Booking = {
  id: string;
  shower_id: string;
  booking_date: string;
  booking_time: string;
  subtotal_cents: number;
  status: string;
  listing?: {
    title: string;
    city: string;
    address: string;
  };
};

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAccount() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setEmail(user.email || "");

      const { data: bookingData } = await supabase
        .from("bookings")
        .select(
          "id, shower_id, booking_date, booking_time, subtotal_cents, status"
        )
        .eq("guest_id", user.id)
        .order("booking_date", { ascending: false });

      const bookingsRaw = bookingData || [];
      const showerIds = Array.from(new Set(bookingsRaw.map((b) => b.shower_id)));

      let listings: { id: string; title: string; city: string; address: string }[] = [];

      if (showerIds.length > 0) {
        const { data } = await supabase
          .from("listings")
          .select("id, title, city, address")
          .in("id", showerIds);

        listings = data || [];
      }

      const combined = bookingsRaw.map((booking) => ({
        ...booking,
        listing: listings.find((listing) => listing.id === booking.shower_id),
      }));

      setBookings(combined);
      setLoading(false);
    }

    loadAccount();
  }, []);

  function statusLabel(status: string) {
    if (status === "confirmed") return "Bevestigd";
    if (status === "rejected") return "Geweigerd";
    return "In afwachting";
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
              ShowerShare
            </p>
            <h1 className="text-4xl font-bold">Mijn account</h1>
            <p className="mt-2 text-[#68756F]">{email}</p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/search"
              className="rounded-xl bg-[#168568] px-5 py-3 font-semibold text-white"
            >
              Zoek een douche
            </Link>

            <Link
              href="/host/dashboard"
              className="rounded-xl border border-[#D6DEDA] bg-white px-5 py-3 font-semibold"
            >
              Host-dashboard
            </Link>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold">Mijn boekingen</h2>
          <p className="mt-1 text-[#68756F]">
            Bekijk hier de status van je reserveringen.
          </p>

          <div className="mt-6 space-y-4">
            {bookings.length === 0 ? (
              <div className="rounded-2xl border border-[#D6DEDA] bg-white p-6">
                Je hebt nog geen boekingen.
              </div>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-[#D6DEDA] bg-white p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold">
                        {booking.listing?.title || "Douche"}
                      </h3>

                      <p className="mt-1 text-[#68756F]">
                        {booking.listing?.city}
                        {booking.listing?.address
                          ? ` · ${booking.listing.address}`
                          : ""}
                      </p>

                      <p className="mt-3 text-[#68756F]">
                        {booking.booking_date} · {booking.booking_time}
                      </p>
                    </div>

                    <span className="rounded-full bg-[#E4F5EF] px-4 py-2 text-sm font-semibold text-[#168568]">
                      {statusLabel(booking.status)}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl bg-[#F8FAF9] p-4 text-sm">
                {booking.status === "confirmed" && (
                  <p className="font-medium text-[#168568]">
                    Je reservering is bevestigd. Je kunt op het gekozen moment terecht.
                  </p>
                )}

                {booking.status === "rejected" && (
                  <p className="font-medium text-[#68756F]">
                    Deze reservering is geweigerd. Je betaling wordt terugbetaald.
                  </p>
                )}

                {booking.status === "pending" && (
                  <p className="font-medium text-[#68756F]">
                    Je betaling is ontvangen. De host moet je reservering nog accepteren.
                  </p>
                )}
              </div>

              <div className="mt-5 border-t border-[#E8EEEB] pt-4 flex justify-between">
                    <span className="font-semibold">Totaal</span>
                    <span className="font-bold">
                      €
                      {(booking.subtotal_cents / 100)
                        .toFixed(2)
                        .replace(".", ",")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
