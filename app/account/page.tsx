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
    if (status === "cancelled") return "Geannuleerd";
    if (status === "rejected") return "Geweigerd";
    if (status === "pending") return "In afwachting";
    return "Onbekende status";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAF9] p-10 text-[#17221D]">
        Laden...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAF9] text-[#16211D]">
      <header className="border-b border-[#E4EAE7] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Shower<span className="text-[#168B80]">Share</span>
          </Link>
          <Link
            href="/search"
            className="rounded-full border border-[#E4EAE7] px-5 py-2 text-sm font-semibold"
          >
            Zoek een douche
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#168B80]">
          Jouw persoonlijke omgeving
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Mijn account
        </h1>

        <p className="mt-4 text-[#68756F]">
          Bekijk je reserveringen en beheer jouw ShowerShare-activiteiten.
        </p>

        <section className="mt-10 flex flex-wrap items-center justify-between gap-6 rounded-[28px] border border-[#E1EAE5] bg-white p-7 shadow-sm sm:p-9">
          <div className="flex min-w-0 items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#E5F4EE] text-2xl font-bold text-[#176D68]">
              {(email || "S").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#168B80]">
                Ingelogd account
              </p>
              <h2 className="mt-1 break-all text-lg font-bold">
                {email || "Niet ingelogd"}
              </h2>
            </div>
          </div>

          <Link
            href="/host/dashboard"
            className="rounded-2xl bg-[#176D68] px-6 py-3 font-semibold text-white hover:bg-[#115651]"
          >
            Host-dashboard →
          </Link>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#168B80]">
                Reserveringsoverzicht
              </p>
              <h2 className="mt-2 text-3xl font-bold">Mijn boekingen</h2>
              <p className="mt-2 text-[#68756F]">
                Bekijk de status en gegevens van je reserveringen.
              </p>
            </div>

            <span className="rounded-full bg-[#E5F4EE] px-4 py-2 text-sm font-bold text-[#176D68]">
              {bookings.length} {bookings.length === 1 ? "boeking" : "boekingen"}
            </span>
          </div>

          {bookings.length === 0 ? (
            <div className="mt-7 rounded-[28px] border border-[#E1EAE5] bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E5F4EE] text-3xl">
                🚿
              </div>
              <h3 className="mt-5 text-2xl font-bold">Nog geen boekingen</h3>
              <p className="mt-3 text-[#68756F]">
                Zodra je een douche hebt geboekt, vind je hier je reservering.
              </p>
              <Link
                href="/search"
                className="mt-7 inline-block rounded-2xl bg-[#176D68] px-6 py-3 font-bold text-white"
              >
                Ontdek beschikbare douches →
              </Link>
            </div>
          ) : (
            <div className="mt-7 grid gap-5">
              {bookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-[28px] border border-[#E1EAE5] bg-white p-6 shadow-sm sm:p-8"
                >
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#168B80]">
                        Douche reservering
                      </p>
                      <h3 className="mt-2 text-2xl font-bold">
                        {booking.listing?.title || "Douche"}
                      </h3>
                      <p className="mt-2 text-sm text-[#68756F]">
                        {booking.listing?.city || "Locatie onbekend"}
                        {booking.listing?.address
                          ? ` · ${booking.listing.address}`
                          : ""}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-bold ${
                        booking.status === "confirmed"
                          ? "bg-[#E5F4EE] text-[#176D68]"
                          : booking.status === "cancelled" ||
                            booking.status === "rejected"
                          ? "bg-[#FCECEC] text-[#A43B3B]"
                          : "bg-[#FFF5E5] text-[#9B651C]"
                      }`}
                    >
                      {statusLabel(booking.status)}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 rounded-2xl bg-[#F3F8F5] p-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-[#68756F]">
                        Datum en tijd
                      </p>
                      <p className="mt-2 font-bold">
                        {booking.booking_date} · {booking.booking_time?.slice(0, 5)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#68756F]">
                        Reserveringsbedrag
                      </p>
                      <p className="mt-2 text-xl font-bold">
                        €{(booking.subtotal_cents / 100).toLocaleString("nl-NL", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  {booking.status === "confirmed" && (
                    <p className="mt-5 text-sm text-[#53615B]">
                      ✓ Je reservering is bevestigd.
                    </p>
                  )}

                  {booking.status === "pending" && (
                    <p className="mt-5 text-sm text-[#53615B]">
                      Je reservering wordt nog verwerkt.
                    </p>
                  )}

                  {(booking.status === "cancelled" ||
                    booking.status === "rejected") && (
                    <p className="mt-5 text-sm text-[#53615B]">
                      Deze reservering is niet meer actief.
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
