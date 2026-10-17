import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const showerId = url.searchParams.get("showerId");

    if (!showerId || !/^[0-9a-f-]{36}$/i.test(showerId)) {
      return NextResponse.json(
        { error: "Ongeldige douche-ID." },
        { status: 400 }
      );
    }

    const now = new Date();

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Amsterdam",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const { data: slots, error: slotError } = await supabaseServer
      .from("availability_slots")
      .select("id, shower_id, host_id, slot_date, start_time, end_time")
      .eq("shower_id", showerId)
      .gte("slot_date", today)
      .order("slot_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (slotError) throw slotError;

    const { data: bookings, error: bookingError } = await supabaseServer
      .from("bookings")
      .select("booking_date, booking_time, duration_minutes")
      .eq("shower_id", showerId)
      .in("status", ["pending", "confirmed"])
      .gte("booking_date", today);

    if (bookingError) throw bookingError;

    console.log("ShowerShare beschikbaarheid diagnose:", {
      aantalTijdsloten: slots?.length ?? 0,
      aantalActieveBoekingen: bookings?.length ?? 0,
      boekingOpTestmoment: (bookings ?? []).some(
        (b) =>
          b.booking_date === "2026-10-26" &&
          b.booking_time === "15:17:00"
      ),
    });

    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const availableSlots = (slots ?? []).filter((slot) => {
      const start = toMinutes(slot.start_time);
      const end = toMinutes(slot.end_time);

      if (end <= start) return false;


      // Vergelijk huidige Nederlandse datum en tijd.
      const currentLocal = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Europe/Amsterdam",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now).replace(" ", "T");

      if (`${slot.slot_date}T${slot.start_time}` <= currentLocal) {
        return false;
      }

      return !(bookings ?? []).some((booking) => {
        if (booking.booking_date !== slot.slot_date) return false;

        const bookedStart = toMinutes(booking.booking_time);
        const bookedEnd = bookedStart + booking.duration_minutes;

        return bookedStart < end && bookedEnd > start;
      });
    });

    return NextResponse.json(
      { slots: availableSlots },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Beschikbaarheid ophalen mislukt:", error);

    return NextResponse.json(
      { error: "Beschikbaarheid kon niet worden opgehaald." },
      { status: 500 }
    );
  }
}
