export default function Home() {
  return (
    <section className="grid place-items-center py-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-emerald-600">
          Bean There ☕
        </h1>
        <p className="text-slate-600 max-w-prose mx-auto">
          Hello baby shark! This is our cozy space to rate cafés and keep memories.
        </p>
        <div className="pt-4">
          <a
            href="/cafes/new"
            className="inline-block rounded-lg bg-emerald-600 text-white px-5 py-3 hover:bg-emerald-700"
          >
            Add our first café
          </a>
        </div>
      </div>
    </section>
  );
}