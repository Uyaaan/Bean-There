import { Link } from "react-router-dom";

export default function CafesList() {
  // temporary empty state — we’ll load from localStorage soon
  const cafes = [];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Our Cafés</h2>
        <Link
          to="/cafes/new"
          className="rounded-lg bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700"
        >
          Add Café
        </Link>
      </div>

      {cafes.length === 0 ? (
        <div className="rounded-xl border p-6 text-center text-slate-500">
          No cafés yet. <Link to="/cafes/new" className="text-emerald-600 underline">Add one</Link> ☕
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cafes.map(cafe => (
            <li key={cafe.id} className="rounded-xl border bg-white p-4">
              <Link to={`/cafes/${cafe.id}`} className="block">
                <h3 className="font-semibold">{cafe.name}</h3>
                <p className="text-sm text-slate-500 line-clamp-2">{cafe.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}