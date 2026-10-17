import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Handmatig accepteren en weigeren is uitgeschakeld. Reserveringen worden automatisch bevestigd na betaling.",
    },
    { status: 403 }
  );
}
