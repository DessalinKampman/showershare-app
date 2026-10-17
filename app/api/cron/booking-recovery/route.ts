import { POST as runBookingRecovery } from "@/app/api/booking-recovery/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel Cron gebruikt GET.
// De bestaande herstelprocedure controleert zelf CRON_SECRET.
export async function GET(request: Request) {
  return runBookingRecovery(request);
}
