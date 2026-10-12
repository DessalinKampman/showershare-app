import Link from "next/link";

const features = [
  {
    icon: "📍",
    title: "Vind een douche dichtbij",
    desc: "Ontdek beschikbare douches bij jou in de buurt of onderweg.",
  },
  {
    icon: "⚡",
    title: "Snel geregeld",
    desc: "Kies een douche, selecteer een moment en boek eenvoudig online.",
  },
  {
    icon: "🛡️",
    title: "Veilig & vertrouwd",
    desc: "Duidelijke profielen, transparante prijzen en betrouwbare betalingen.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8FAF9] text-[#16211D]">
      {/* Navigatie */}
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#167D68] text-xl text-white">
              S
            </div>
            <span className="text-xl font-bold tracking-tight">
              ShowerShare
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/search"
              className="hidden rounded-full px-4 py-2 text-sm font-medium hover:bg-[#F1F5F3] sm:block"
            >
              Vind een douche
            </Link>

            <Link
              href="/host"
              className="hidden rounded-full px-4 py-2 text-sm font-medium hover:bg-[#F1F5F3] sm:block"
            >
              Word host
            </Link>

            <Link
              href="/account"
              className="rounded-full border border-[#DDE6E2] bg-white px-5 py-2.5 text-sm font-semibold transition hover:bg-[#F1F5F3]"
            >
              Mijn account
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#E4F4EF] px-4 py-2 text-sm font-semibold text-[#126B59]">
              <span>●</span>
              Douchen waar je ook bent
            </div>

            <h1 className="max-w-xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Een warme douche.
              <span className="block text-[#167D68]">Waar je maar wilt.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-[#5C6B65]">
              Vind beschikbare douches bij mensen en locaties in de buurt.
              Boek eenvoudig een moment, betaal veilig en stap fris weer naar
              buiten.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="rounded-2xl bg-[#167D68] px-6 py-4 font-semibold text-white shadow-sm transition hover:bg-[#116A58]"
              >
                Zoek een douche →
              </Link>

              <Link
                href="/host"
                className="rounded-2xl border border-[#D8E1DD] bg-white px-6 py-4 font-semibold transition hover:bg-[#F1F5F3]"
              >
                Bied jouw douche aan
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#64716C]">
              <span>✓ Transparante prijzen</span>
              <span>✓ Veilig betalen</span>
              <span>✓ Snel geboekt</span>
            </div>
          </div>

          {/* Visuele kaart */}
          <div className="relative">
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#BDE8DB] blur-3xl" />
            <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#D7EEE7] blur-3xl" />

            <div className="relative rounded-[32px] bg-[#DDF1EB] p-6 sm:p-9">
              <div className="rounded-[26px] bg-white p-6 shadow-xl shadow-[#126B59]/10">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#73817B]">
                      Beschikbaar in de buurt
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">
                      Vind jouw douche
                    </h2>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E4F4EF] text-2xl">
                    🚿
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-[#E4EAE7] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Warme douche</p>
                        <p className="mt-1 text-sm text-[#74817C]">
                          Dichtbij • beschikbaar
                        </p>
                      </div>
                      <p className="font-bold text-[#167D68]">€6</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#E4EAE7] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Privé douche</p>
                        <p className="mt-1 text-sm text-[#74817C]">
                          Snel te boeken
                        </p>
                      </div>
                      <p className="font-bold text-[#167D68]">€5</p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/search"
                  className="mt-5 block rounded-2xl bg-[#16211D] px-5 py-4 text-center font-semibold text-white"
                >
                  Bekijk beschikbare douches
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hoe het werkt */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <p className="font-semibold text-[#167D68]">HOE HET WERKT</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Fris in drie simpele stappen.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[24px] border border-[#E4EAE7] bg-[#FBFCFB] p-7"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E4F4EF] text-xl">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 leading-7 text-[#68756F]">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Host CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-[#163F36] px-8 py-12 text-white sm:px-12">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#9DDBCA]">
                WORD SHOWERShare HOST
              </p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Heb je een douche over?
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-white/70">
                Stel jouw douche beschikbaar wanneer het jou uitkomt en verdien
                aan iedere boeking.
              </p>
            </div>

            <Link
              href="/host"
              className="shrink-0 rounded-2xl bg-white px-6 py-4 font-bold text-[#163F36]"
            >
              Word host →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 text-sm text-[#68756F] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-bold text-[#16211D]">ShowerShare</span>
            <span className="ml-2">
              © {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[#16211D]">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#16211D]">
              Voorwaarden
            </Link>
            <Link href="/account" className="hover:text-[#16211D]">
              Account
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
