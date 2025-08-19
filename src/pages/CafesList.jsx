import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { listCafes } from "../services/cafes.api";
import { supabase } from "../services/supabaseClient";

// Helpers
function toNumber(v) {
  if (v === "" || v == null) return 0;
  const n = Number(typeof v === "string" ? v.replace(/,/g, "") : v);
  return Number.isFinite(n) ? n : 0;
}
function formatPHP(n) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n || 0);
}
function totalCost(cafe) {
  // Support multiple shapes (price, qty) and fallbacks from CafeNew
  const bevArr = cafe?.beverages || cafe?.beverageItems || [];
  const foodArr = cafe?.foods || cafe?.foodItems || [];
  const sumArr = (arr) =>
    (Array.isArray(arr) ? arr : []).reduce((sum, item) => {
      const price = toNumber(item.price ?? item.unitPrice ?? item.cost ?? 0);
      const qty = toNumber(item.qty ?? item.quantity ?? 1) || 1;
      return sum + price * qty;
    }, 0);
  const bev = sumArr(bevArr);
  const food = sumArr(foodArr);
  const fallback = toNumber(cafe?.orderTotal ?? cafe?.total ?? 0);
  const computed = bev + food;
  return computed > 0 ? computed : fallback;
}
function getOverallRating(cafe) {
  // Try common field names and coerce to number
  const val =
    cafe?.rating?.overall ??
    cafe?.rating?.average ??
    cafe?.overallRating ??
    cafe?.rating_overall ??
    cafe?.rating ?? 0;
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}
function MiniStars({ value = 0, max = 5 }) {
  const n = Math.max(0, Math.min(max, Math.round(Number(value) || 0)));
  const stars = Array.from({ length: max }, (_, i) => (i < n ? "★" : "☆"));
  return (
    <span className="inline-flex items-center gap-1 text-amber-600" aria-label={`${n} out of ${max} stars`}>
      <span className="leading-none" style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
        {stars.join("")}
      </span>
      <span className="text-xs text-slate-500">{(Number(value) || 0).toFixed(1)}</span>
    </span>
  );
}

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

  async function deleteCafe(id) {
    const { error } = await supabase.from("cafes").delete().eq("id", id);
    if (error) throw error;
    return true;
  }

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
        <div className="rounded-xl border p-6 text-center text-slate-500">Loading cafés...</div>
      )}
      {error && (
        <div className="rounded-xl border p-6 text-center text-red-500">{error}</div>
      )}

      {!loading && !error && (
        cafes.length === 0 ? (
          <div className="rounded-xl border p-6 text-center text-slate-500">
            No cafés yet. <Link to="/cafes/new" className="text-emerald-600 underline">Add one</Link> ☕
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cafes.map((cafe) => {
              const total = totalCost(cafe);
              const overall = getOverallRating(cafe);

              return (
                <li key={cafe.id} className="rounded-xl border bg-white p-4 flex flex-col">
                  <Link to={`/cafes/${cafe.id}`} className="block">
                    <h3 className="font-semibold">{cafe.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{cafe.description || "—"}</p>
                  </Link>

                  {/* Ratings row */}
                  <div className="mt-3 flex items-center gap-1">
                    <span className="text-xs uppercase tracking-wide text-slate-500">Overall</span>
                    <MiniStars value={overall} />
                  </div>

                  {/* Features */}
                  {Array.isArray(cafe.features) && cafe.features.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {cafe.features.slice(0, 6).map((f) => (
                        <span key={f} className="text-xs rounded-full border px-2 py-0.5">
                          {f.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Total */}
                  <div className="mt-3 text-sm text-slate-700">
                    Total (Food + Beverages): <span className="font-semibold">{formatPHP(total)}</span>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2">
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
              );
            })}
          </ul>
        )
      )}
    </section>
  );
}