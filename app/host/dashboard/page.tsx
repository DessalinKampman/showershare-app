"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Listing = {
  id: string;
  title: string;
  city: string;
  address: string;
  price_per_use: number;
  available: boolean;
};

type Booking = {
  id: string;
  shower_id: string;
  booking_date: string;
  booking_time: string;
  subtotal_cents: number;
  platform_fee_cents: number;
  host_payout_cents: number;
  status: string;
  listing?: Listing;
};

export default function HostDashboardPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState("Laden...");
const [connectLoading, setConnectLoading] = useState(false);
const [connectError, setConnectError] = useState("");

  async function startStripeOnboarding() {
    if (connectLoading) return;

    setConnectLoading(true);
    setConnectError("");

    try {
      const { data, error } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (error || !token) {
        throw new Error("Log opnieuw in om je uitbetalingen in te stellen.");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const createResponse = await fetch("/api/connect/create-account", {
        method: "POST",
        headers,
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createData.error || "Stripe-account aanmaken mislukt.");
      }

      const onboardingResponse = await fetch("/api/connect/onboarding", {
        method: "POST",
        headers,
      });

      const onboardingData = await onboardingResponse.json();

      if (!onboardingResponse.ok) {
        throw new Error(onboardingData.error || "Stripe-onboarding starten mislukt.");
      }

      if (onboardingData.onboardingComplete) {
        setConnectError("Je Stripe-account is al ingesteld.");
        return;
      }

      const url = onboardingData.url;

      if (
        typeof url !== "string" ||
        !url.startsWith("https://connect.stripe.com/")
      ) {
        throw new Error("Ongeldige Stripe-onboardinglink.");
      }

      window.location.assign(url);
    } catch (error) {
      setConnectError(
        error instanceof Error ? error.message : "Er is iets misgegaan."
      );
    } finally {
      setConnectLoading(false);
    }
  }

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus("Je moet ingelogd zijn.");
        return;
      }

      const { data: listingData, error: listingError } = await supabase
        .from("listings")
        .select("id, title, city, address, price_per_use, available")
        .eq("user_id", user.id);

      if (listingError) {
        console.error(listingError);
        setStatus("Je douches konden niet worden geladen.");
        return;
      }

      const hostListings = listingData || [];
      setListings(hostListings);

      if (hostListings.length === 0) {
        setBookings([]);
        setStatus("Geladen");
        return;
      }

      const showerIds = hostListings.map((listing) => listing.id);

      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select(
          "id, shower_id, booking_date, booking_time, subtotal_cents, platform_fee_cents, host_payout_cents, status"
        )
        .in("shower_id", showerIds)
        .order("booking_date", { ascending: false });

      if (bookingError) {
        console.error(bookingError);
        setStatus("Reserveringen konden niet worden geladen.");
        return;
      }

      const bookingsWithListings = (bookingData || []).map((booking) => ({
        ...booking,
        listing: hostListings.find(
          (listing) => listing.id === booking.shower_id
        ),
      }));

      setBookings(bookingsWithListings);
      setStatus("Geladen");
    }

    loadDashboard();
  }, []);


  async function toggleListingAvailability(listing: Listing) {
    const { data: { user }, error: authError } =
      await supabase.auth.getUser();

    if (authError || !user) {
      alert("Log opnieuw in.");
      return;
    }

    const { data, error } = await supabase
      .from("listings")
      .update({ available: !listing.available })
      .eq("id", listing.id)
      .eq("user_id", user.id)
      .select("id, available")
      .single();

    if (error || !data) {
      alert(error?.message || "Status wijzigen mislukt.");
      return;
    }

    setListings(current =>
      current.map(item =>
        item.id === listing.id
          ? { ...item, available: data.available }
          : item
      )
    );
  }

  async function updateBookingStatus(
    bookingId: string,
    newStatus: string
  ) {
    try {
      const response = await fetch("/api/update-booking-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Status aanpassen is mislukt.");
      }

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: newStatus }
            : booking
        )
      );
    } catch (error: unknown) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Status aanpassen is mislukt."
      );
    }
  }

  const totalRevenue = bookings
    .filter((booking) => booking.status === "confirmed")
    .reduce(
      (total, booking) => total + (booking.host_payout_cents || 0),
      0
    );

  const pendingBookings = bookings.filter(
    (booking) => booking.status === "pending"
  ).length;

  return (
    <main className="min-h-screen bg-[#F8FAF9] text-[#17221D]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#168568]">
              ShowerShare Host
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Host-dashboard
            </h1>

            <p className="mt-2 text-[#68756F]">
              Beheer je douches, reserveringen en inkomsten.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/host"
              className="rounded-full bg-[#168568] px-5 py-3 text-sm font-semibold text-white"
            >
              + Douche toevoegen
            </Link>

            <Link
              href="/host/availability"
              className="rounded-full border border-[#DDE6E2] bg-white px-5 py-3 text-sm font-semibold hover:bg-[#F1F5F3]"
            >
              Beschikbaarheid beheren
            </Link>

            <Link
              href="/account"
              className="rounded-full border border-[#DDE6E2] bg-white px-5 py-3 text-sm font-semibold"
            >
              Mijn account
            </Link>
          </div>
        </div>

        {status !== "Geladen" ? (
          <div className="mt-10 rounded-2xl border border-[#DDE6E2] bg-white p-6">
            {status}
          </div>
        ) : (
          <>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-[#DDE6E2] bg-white p-6">
                <p className="text-sm text-[#68756F]">Mijn douches</p>
                <p className="mt-2 text-3xl font-bold">{listings.length}</p>
              </div>

              <div className="rounded-3xl border border-[#DDE6E2] bg-white p-6">
                <p className="text-sm text-[#68756F]">
                  Reserveringen in afwachting
                </p>
                <p className="mt-2 text-3xl font-bold">{pendingBookings}</p>
              </div>

              <div className="rounded-3xl border border-[#DDE6E2] bg-white p-6">
                <p className="text-sm text-[#68756F]">Totale inkomsten</p>
                <p className="mt-2 text-3xl font-bold">
                  €{(totalRevenue / 100).toFixed(2).replace(".", ",")}
                </p>
                <p className="mt-1 text-xs text-[#68756F]">
                  Na 15% ShowerShare-servicekosten
                </p>
              </div>
            </div>

            <section className="mt-12">
              <h2 className="text-2xl font-bold">Mijn douches</h2>
              <p className="mt-1 text-sm text-[#68756F]">
                De douches die jij aanbiedt op ShowerShare.
              </p>

              {listings.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-[#DDE6E2] bg-white p-7">
                  <p className="font-semibold">
                    Nog geen douche toegevoegd.
                  </p>
                  <p className="mt-1 text-sm text-[#68756F]">
                    Voeg je eerste douche toe om boekingen te ontvangen.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {listings.map((listing) => (
                    <div
                      key={listing.id}
                      className="rounded-3xl border border-[#DDE6E2] bg-white p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold">
                            {listing.title}
                          </h3>
                          <p className="mt-1 text-sm text-[#68756F]">
                            {listing.city} · {listing.address}
                          </p>
                        </div>

                        <span className="rounded-full bg-[#E4F5EF] px-3 py-1 text-sm font-semibold text-[#167D68]">
                          €{Number(listing.price_per_use)
                            .toFixed(2)
                            .replace(".", ",")}
                        </span>
                      </div>

                      <Link
                        href={`/shower/${listing.id}`}
                        className="mt-5 inline-block text-sm font-semibold text-[#167D68] underline"
                      >
                        Bekijk advertentie
                      </Link>
                <div className="mt-4">
                  <span className={
                    listing.available
                      ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800"
                      : "rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
                  }>
                    {listing.available ? "Actief" : "Gepauzeerd"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleListingAvailability(listing)}
                  className="mt-4 rounded-xl border border-[#168568] px-4 py-2 text-sm font-semibold text-[#168568] hover:bg-green-50"
                >
                  {listing.available
                    ? "Advertentie pauzeren"
                    : "Advertentie activeren"}
                </button>

                <Link
                  href={`/host/edit/${listing.id}`}
                  className="ml-5 inline-block text-sm font-semibold text-[#168568] underline"
                >
                  Bewerk advertentie
                </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-12 rounded-3xl border border-[#D0E6D2] bg-white p-7">
              <h2 className="text-2xl font-bold">Uitbetalingen</h2>
              <p className="mt-2 text-sm text-[#68756F]">
                Ontvang 75% van iedere boeking. ShowerShare ontvangt 25% commissie.
              </p>
              <button
                type="button"
                onClick={startStripeOnboarding}
                disabled={connectLoading}
                className="mt-5 rounded-xl bg-[#168568] px-6 py-3 font-semibold text-white disabled:opacity-50"
              >
                {connectLoading ? "Even geduld..." : "Uitbetalingen instellen"}
              </button>
              {connectError && (
                <p className="mt-3 text-sm text-red-700" role="alert">
                  {connectError}
                </p>
              )}
            </section>

            <section className="mt-12">
              <h2 className="text-2xl font-bold">Reserveringen</h2>
              <p className="mt-1 text-sm text-[#68756F]">
                Boekingen voor jouw douches.
              </p>

              {bookings.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-[#DDE6E2] bg-white p-7">
                  <p className="font-semibold">
                    Nog geen reserveringen.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-3xl border border-[#DDE6E2] bg-white p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold">
                            {booking.listing?.title || "Douche"}
                          </h3>

                          <p className="mt-2 text-sm text-[#68756F]">
                            {booking.booking_date} ·{" "}
                            {booking.booking_time?.slice(0, 5)}
                          </p>
                        </div>

                        <span className="rounded-full bg-[#E4F5EF] px-3 py-1 text-sm font-semibold text-[#167D68]">
                          {booking.status === "confirmed"
                            ? "Bevestigd"
                            : booking.status === "pending"
                            ? "In afwachting"
                            : booking.status === "rejected"
                            ? "Geweigerd"
                            : booking.status}
                        </span>
                      </div>

                      <div className="mt-5 border-t border-[#E8EEEB] pt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#68756F]">
                            Gast betaalt
                          </span>
                          <span className="font-semibold">
                            €{(booking.subtotal_cents / 100)
                              .toFixed(2)
                              .replace(".", ",")}
                          </span>
                        </div>

                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-[#68756F]">
                            ShowerShare 25%
                          </span>
                          <span>
                            - €{(booking.platform_fee_cents / 100)
                              .toFixed(2)
                              .replace(".", ",")}
                          </span>
                        </div>

                        <div className="mt-3 flex justify-between font-bold">
                          <span>Jij ontvangt</span>
                          <span>
                            €{(booking.host_payout_cents / 100)
                              .toFixed(2)
                              .replace(".", ",")}
                          </span>
                        </div>
                      </div>

                      {booking.status === "pending" && (
                        <div className="mt-5 flex gap-3">
                          <button
                            onClick={() =>
                              updateBookingStatus(
                                booking.id,
                                "confirmed"
                              )
                            }
                            className="rounded-xl bg-[#168568] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                          >
                            Accepteren
                          </button>

                          <button
                            onClick={() =>
                              updateBookingStatus(
                                booking.id,
                                "rejected"
                              )
                            }
                            className="rounded-xl border border-[#D6DEDA] bg-white px-5 py-3 text-sm font-semibold text-[#17221D] hover:bg-[#F8FAF9]"
                          >
                            Weigeren
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
