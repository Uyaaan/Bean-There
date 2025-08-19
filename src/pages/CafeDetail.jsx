import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

function toNumber(v) {
  return v === "" || v == null ? 0 : Number(v);
}
function formatPHP(n) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(n || 0);
}
function MiniStars({ value = 0, max = 5 }) {
  const n = Math.round(value);
  const stars = Array.from({ length: max }, (_, i) => (i < n ? "★" : "☆"));
  return (
    <span className="inline-flex items-center gap-1 text-amber-600" title={`${value}/${max}`}>
      <span className="leading-none">{stars.join("")}</span>
      <span className="text-xs text-slate-500">{value ?? 0}</span>
    </span>
  );
}

export default function CafeDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [cafe, setCafe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function fetchCafe() {
      const { data, error } = await supabase
        .from("cafes")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        console.error(error);
        setErr("Failed to load café.");
      } else {
        setCafe(data);
      }
      setLoading(false);
    }
    fetchCafe();
  }, [id]);

  const bevTotal = (cafe?.beverages ?? []).reduce((s, b) => s + toNumber(b.price), 0);
  const foodTotal = (cafe?.foods ?? []).reduce((s, f) => s + toNumber(f.price), 0);
  const grandTotal = bevTotal + foodTotal;

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="text-slate-500">Loading café…</div>
      </section>
    );
  }
  if (err || !cafe) {
    return (
      <section className="space-y-4">
        <div className="text-red-600">{err || "Café not found."}</div>
        <Link to="/cafes" className="text-emerald-600 underline">Back to list</Link>
      </section>
    );
  }

  const { name, description, features = [], rating = {}, createdBy, createdAt } = cafe;
  const createdDate = createdAt ? new Date(createdAt).toLocaleDateString() : "";

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{name}</h1>
          {description && <p className="text-slate-600 mt-1">{description}</p>}
          <div className="mt-2 flex items-center gap-3">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-slate-500">Overall</span>
              <MiniStars value={rating.overall ?? 0} />
            </div>
            {(rating.vibe || rating.staff || rating.seats) && (
              <div className="inline-flex items-center gap-4 text-sm text-slate-600">
                {rating.vibe ? <>Vibe <MiniStars value={rating.vibe} /></> : null}
                {rating.staff ? <>Staff <MiniStars value={rating.staff} /></> : null}
                {rating.seats ? <>Seats <MiniStars value={rating.seats} /></> : null}
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {createdBy ? `Added by ${createdBy}` : null} {createdDate ? `• ${createdDate}` : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/cafes"
            className="rounded-lg border px-3 py-2 hover:bg-slate-50"
          >
            ← Back
          </Link>
          <Link
            to={`/cafes/${id}/edit`}
            className="rounded-lg border px-3 py-2 hover:bg-slate-50"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Features */}
      {features.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Features</h2>
          <div className="flex flex-wrap gap-2">
            {features.map((f) => (
              <span key={f} className="text-xs rounded-full border px-2 py-0.5">
                {f.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Orders (overall experience notes) */}
      {Array.isArray(cafe.orders) && cafe.orders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Order Notes</h2>
          <ul className="space-y-3">
            {cafe.orders.map((o, i) => (
              <li key={i} className="rounded-xl border bg-white p-4">
                <div className="text-sm text-slate-600">
                  <span className="font-medium">{o.person}</span>
                  {typeof o.rating === "number" ? (
                    <span className="ml-2"><MiniStars value={o.rating} /></span>
                  ) : null}
                </div>
                {o.notes ? <p className="text-sm text-slate-700 mt-2">{o.notes}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Beverages */}
      <div>
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold">Beverages</h2>
          <div className="text-sm text-slate-600">Subtotal: <b>{formatPHP(bevTotal)}</b></div>
        </div>
        {(!cafe.beverages || cafe.beverages.length === 0) ? (
          <div className="mt-2 rounded-xl border p-4 text-slate-500 text-sm">No drinks recorded.</div>
        ) : (
          <ul className="mt-2 space-y-2">
            {cafe.beverages.map((b, i) => (
              <li key={i} className="rounded-xl border bg-white p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium">{b.name || "—"}</div>
                  {b.notes ? <div className="text-sm text-slate-600">{b.notes}</div> : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">{formatPHP(toNumber(b.price))}</span>
                  {typeof b.rating === "number" ? <MiniStars value={b.rating} /> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Food */}
      <div>
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold">Food</h2>
          <div className="text-sm text-slate-600">Subtotal: <b>{formatPHP(foodTotal)}</b></div>
        </div>
        {(!cafe.foods || cafe.foods.length === 0) ? (
          <div className="mt-2 rounded-xl border p-4 text-slate-500 text-sm">No food recorded.</div>
        ) : (
          <ul className="mt-2 space-y-2">
            {cafe.foods.map((f, i) => (
              <li key={i} className="rounded-xl border bg-white p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium">{f.name || "—"}</div>
                  {f.notes ? <div className="text-sm text-slate-600">{f.notes}</div> : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">{formatPHP(toNumber(f.price))}</span>
                  {typeof f.rating === "number" ? <MiniStars value={f.rating} /> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Grand total */}
      <div className="text-right text-base">
        <span className="text-slate-600 mr-2">Total (Food + Beverages):</span>
        <b>{formatPHP(grandTotal)}</b>
      </div>
    </section>
  );
}