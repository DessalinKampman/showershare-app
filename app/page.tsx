export default function Home() {
  const features = [
    {
      title: "Snel",
      desc: "Binnen 2 minuten geboekt.",
    },
    {
      title: "Veilig",
      desc: "Hosts & gasten geverifieerd (straks via Supabase).",
    },
    {
      title: "Eerlijk",
      desc: "Transparante prijzen en duidelijke regels.",
    },
  ];

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* Top bar */}
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚿</span>
            <span className="font-semibold tracking-tight">ShowerShare</span>
          </div>

          <nav className="flex items-center gap-2">
            <a
              href="#"
              className="rounded-full px-4 py-2 text-sm hover:bg-neutral-100"
            >
              Inloggen
            </a>
            <a
              href="#"
              className="rounded-full border px-4 py-2 text-sm hover:bg-neutral-50"
            >
              NL / EN
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-neutral-600">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Live op je domein — nu bouwen we door
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Vind een warme douche, overal.
          </h1>

          <p className="mt-4 text-lg text-neutral-600">
            Boek een douche in de buurt — of bied jouw douche aan en verdien eraan.
            Snel, duidelijk, en gebouwd voor vertrouwen.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#"
              className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Zoek douches
            </a>
            <a
              href="#"
              className="rounded-xl border px-5 py-3 text-sm font-semibold hover:bg-neutral-50"
            >
              Word host
            </a>
          </div>

          <p className="mt-3 text-xs text-neutral-500">
            Volgende stap: accounts (Supabase) → listings → boekingen → betalingen (Stripe).
          </p>
        </div>

        {/* Features */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border p-5">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ShowerShare</p>
          <div className="flex gap-4">
            <a className="hover:text-neutral-900" href="#">
              Privacy
            </a>
            <a className="hover:text-neutral-900" href="#">
              Voorwaarden
            </a>
            <a className="hover:text-neutral-900" href="#">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}