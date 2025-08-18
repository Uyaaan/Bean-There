import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { listCafes, deleteCafe } from "../services/cafes.api";

export default function CafesList() {
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  
  useEffect(() => {
    listCafes()
      .then(setCafes)
      .catch((err) => {
        console.error(err);
        setError("Failed to load cafés");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id, name) {
    const ok = window.confirm(`Delete "${name}"? This cannot be undone.`);
    if (!ok) return;
    try {
      setDeletingId(id);
      await deleteCafe(id);
      setCafes((rows) => rows.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete café.");
    } finally {
      setDeletingId(null);
    }
  }

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

      {loading && (
        <div className="rounded-xl border p-6 text-center text-slate-500">
          Loading cafés...
        </div>
      )}
      {error && (
        <div className="rounded-xl border p-6 text-center text-red-500">
          {error}
        </div>
      )}
      {!loading && !error && (
        cafes.length === 0 ? (
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

                <div className="mt-3 flex items-center gap-2">
                  <Link
                    to={`/cafes/${cafe.id}/edit`}
                    className="inline-flex items-center rounded border px-3 py-1 text-sm hover:bg-slate-50"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(cafe.id, cafe.name)}
                    disabled={deletingId === cafe.id}
                    className="inline-flex items-center rounded bg-alizarin text-white px-3 py-1 text-sm hover:opacity-90 disabled:opacity-60"
                  >
                    {deletingId === cafe.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  );
}