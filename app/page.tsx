import Link from "next/link";

const steps = [
  {
    number: "01",
    icon: "⌕",
    title: "Vind jouw douche",
    description:
      "Ontdek beschikbare douches op een locatie die bij jouw plannen past.",
  },
  {
    number: "02",
    icon: "↗",
    title: "Boek eenvoudig",
    description:
      "Kies een beschikbaar moment en betaal veilig online.",
  },
  {
    number: "03",
    icon: "✳",
    title: "Fris weer verder",
    description:
      "Geniet van een verfrissende douche en vervolg je dag.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8FAF9] text-[#17221D]">
      {/* Navigation */}
      <header className="relative z-20 border-b border-[#E4EBE7] bg-white/95">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#186568] text-xl font-bold text-white">
              S
            </div>
            <span className="text-xl font-bold tracking-tight">
              Shower<span className="text-[#168B85]">Share</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-[#45534C] md:flex">
            <Link href="/search" className="hover:text-[#186568]">
              Zoek een douche
            </Link>
            <Link href="#hoe-werkt-het" className="hover:text-[#186568]">
              Hoe werkt het?
            </Link>
            <Link href="/host" className="hover:text-[#186568]">
              Word host
            </Link>
          </div>

          <Link
            href="/account"
            className="rounded-full border border-[#D6DEDA] px-5 py-3 text-sm font-semibold transition hover:bg-[#F0F6F3]"
          >
            Mijn account
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#F0F8F5]">
        <div className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-[#C3EAE0] opacity-60 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#D5F0EB] opacity-70 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-28">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#CBE5DB] bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#186568]">
              <span className="h-2 w-2 rounded-full bg-[#2EAD8B]" />
              Altijd fris onderweg
            </div>

            <h1 className="max-w-2xl text-5xl font-bold leading-[1.07] tracking-[-0.055em] sm:text-6xl lg:text-[76px]">
              Een frisse start.
              <span className="mt-2 block text-[#168B85]">
                Waar je ook bent.
              </span>
            </h1>

            <p className="mt-7 max-w-lg text-lg leading-8 text-[#5B7066]">
              Van een lange reis tot een drukke dag: vind een douche in de
              buurt, boek eenvoudig en ga weer fris op pad.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="inline-flex items-center justify-center rounded-2xl bg-[#186568] px-7 py-4 font-semibold text-white shadow-lg shadow-[#186568]/15 transition hover:-translate-y-0.5 hover:bg-[#124F52]"
              >
                Zoek een douche <span className="ml-3">→</span>
              </Link>

              <Link
                href="/host"
                className="inline-flex items-center justify-center rounded-2xl border border-[#C7D8D0] bg-white px-7 py-4 font-semibold transition hover:-translate-y-0.5 hover:bg-[#F8FCFA]"
              >
                Bied jouw douche aan
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[#577066]">
              <span>✓ Veilig online betalen</span>
              <span>✓ Duidelijke prijzen</span>
              <span>✓ Eenvoudig boeken</span>
            </div>
          </div>

          {/* Visual composition */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-5 rounded-[48px] bg-[#CDEBE1]/50 blur-2xl" />

            <div className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[#E2F0E9] p-5 shadow-2xl shadow-[#1D5748]/15 sm:p-8">
              <div className="relative min-h-[380px] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#B9DCD3] via-[#E8F4ED] to-[#F4DDC1] sm:min-h-[440px]">
                <div className="absolute -right-14 -top-20 h-64 w-64 rounded-full border-[30px] border-white/40" />
                <div className="absolute left-[-60px] top-28 h-56 w-56 rounded-full border-[25px] border-white/30" />

                <div className="absolute left-1/2 top-12 h-24 w-40 -translate-x-1/2 rounded-t-[75px] border-[12px] border-b-0 border-[#548F84]/80" />
                <div className="absolute left-1/2 top-[126px] h-4 w-32 -translate-x-1/2 rounded-full bg-[#548F84]" />

                <div className="absolute left-[40%] top-[150px] h-28 w-1 -rotate-12 rounded-full bg-white/80" />
                <div className="absolute left-[49%] top-[158px] h-36 w-1 rounded-full bg-white/80" />
                <div className="absolute left-[58%] top-[150px] h-28 w-1 rotate-12 rounded-full bg-white/80" />
                <div className="absolute left-[34%] top-[177px] h-20 w-1 -rotate-[25deg] rounded-full bg-white/60" />
                <div className="absolute left-[64%] top-[177px] h-20 w-1 rotate-[25deg] rounded-full bg-white/60" />

                <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#7CAFA4]/40 to-transparent" />

                <div className="absolute bottom-6 left-5 right-5 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl backdrop-blur-lg sm:left-8 sm:right-8">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#168B85]">
                        Jouw volgende stop
                      </p>
                      <h3 className="mt-2 text-xl font-bold">
                        Even opfrissen?
                      </h3>
                      <p className="mt-1 text-sm text-[#68756F]">
                        Ontdek douches bij jou in de buurt.
                      </p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#DDF1EC] text-2xl">
                      ✨
                    </div>
                  </div>

                  <Link
                    href="/search"
                    className="mt-5 flex items-center justify-between rounded-xl bg-[#186568] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#124F52]"
                  >
                    Bekijk beschikbare douches <span>↗</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="absolute -left-3 top-12 hidden rounded-2xl border border-[#E5EEE9] bg-white px-5 py-4 shadow-lg sm:block">
              <p className="text-xs text-[#68756F]">Voor onderweg</p>
              <p className="mt-1 font-bold">Fris verder ✳</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="hoe-werkt-het" className="bg-white px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#168B85]">
              Zo eenvoudig is het
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Drie stappen naar fris.
            </h2>
            <p className="mt-5 text-lg text-[#68756F]">
              Geen ingewikkeld gedoe. Gewoon een douche vinden wanneer je
              er eentje nodig hebt.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-[28px] border border-[#E3ECE6] bg-[#F8FAF9] p-8 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#186568]/5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DDF1EC] text-3xl text-[#186568]">
                    {step.icon}
                  </div>
                  <span className="text-sm font-bold text-[#9BAD9F]">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-8 text-2xl font-bold">{step.title}</h3>
                <p className="mt-4 leading-7 text-[#68756F]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hosting */}
      <section className="px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-[#186568] px-8 py-14 text-white sm:px-14 lg:py-20">
          <div className="flex flex-col items-start justify-between gap-9 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#A9E4D7]">
                Word ShowerShare-host
              </p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Jouw douche.
                <br />
                Nieuwe mogelijkheden.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">
                Heb je een douche over? Bepaal zelf je prijs en
                beschikbaarheid en ontvang boekingen via ShowerShare.
              </p>
            </div>
            <Link
              href="/host"
              className="shrink-0 rounded-2xl bg-white px-8 py-4 font-bold text-[#186568] transition hover:-translate-y-0.5 hover:bg-[#EAF7F2]"
            >
              Start als host →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E3ECE6] bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 text-sm text-[#68756F] sm:flex-row sm:items-center">
          <div>
            <span className="text-lg font-bold text-[#186568]">
              ShowerShare
            </span>
            <p className="mt-2">
              © {new Date().getFullYear()} ShowerShare
            </p>
          </div>
          <div className="flex flex-wrap gap-6">
            <Link href="/search" className="hover:text-[#186568]">
              Zoek een douche
            </Link>
            <Link href="/host" className="hover:text-[#186568]">
              Word host
            </Link>
            <Link href="/privacy" className="hover:text-[#186568]">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#186568]">
              Voorwaarden
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
