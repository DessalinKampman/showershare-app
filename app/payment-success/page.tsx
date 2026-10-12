"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState("Boeking bevestigen...");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function confirmBooking() {
      if (!sessionId) {
        setStatus("Geen betalingsgegevens gevonden.");
        return;
      }

      try {
        const response = await fetch("/api/confirm-booking", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Boeking kon niet worden bevestigd.");
        }

        setSuccess(true);
        setStatus("Je douche is succesvol geboekt en je betaling is ontvangen.");
      } catch (error: unknown) {
        console.error(error);
        setStatus(
          "Boeking bevestigen is mislukt: " +
            (error instanceof Error ? error.message : "Onbekende fout")
        );
      }
    }

    confirmBooking();
  }, [sessionId]);

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-neutral-900">
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border p-8">
          <div className="mb-5 text-5xl">{success ? "✓" : "..."}</div>

          <h1 className="text-3xl font-bold">
            {success ? "Betaling geslaagd!" : "Even geduld..."}
          </h1>

          <p className="mt-4 text-neutral-600">{status}</p>

          {success && (
            <div className="mt-8 flex gap-3">
              <Link
                href="/account"
                className="rounded-xl bg-black px-5 py-3 font-semibold text-white"
              >
                Bekijk mijn boekingen
              </Link>

              <Link
                href="/search"
                className="rounded-xl border px-5 py-3 font-semibold"
              >
                Zoek meer douches
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white px-6 py-16">
          <div className="mx-auto max-w-xl">
            <p>Betaling controleren...</p>
          </div>
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
