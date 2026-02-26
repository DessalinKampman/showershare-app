export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-900 flex items-center justify-center">
      <div className="max-w-3xl px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1 text-sm mb-6">
          🚿 <span>ShowerShare</span>
        </div>

        <h1 className="mt-4 text-5xl font-bold tracking-tight">
          Vind een warme douche, overal.
        </h1>

        <p className="mt-6 text-lg text-neutral-600">
          Boek een douche in de buurt — of bied jouw douche aan en verdien eraan.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="/search"
            className="rounded-xl bg-black px-6 py-3 text-white font-medium hover:opacity-90"
          >
            Zoek douches
          </a>

          <a
            href="/host"
            className="rounded-xl border px-6 py-3 font-medium hover:bg-neutral-100"
          >
            Word host
          </a>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3 text-left">
          {[
            { title: "Snel", desc: "Binnen 2 minuten geboekt." },
            { title: "Veilig", desc: "Hosts & gasten geverifieerd." },
            { title: "Eerlijk", desc: "Transparante prijzen." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border p-5">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}