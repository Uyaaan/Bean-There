import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

// --- tiny helpers & UI bits (local to keep this file standalone) ---
function toNumber(v) { return v === "" || v == null ? 0 : Number(v); }
function formatPHP(n) { return new Intl.NumberFormat("en-PH", { style:"currency", currency:"PHP" }).format(n || 0); }
function Section({ title, children }) { return <fieldset className="space-y-3"><legend className="text-lg font-semibold">{title}</legend>{children}</fieldset>; }
function Card({ children }) { return <div className="rounded-xl border bg-white p-4">{children}</div>; }
function RatingStars({ value = 0, onChange, max = 5, size = "text-xl" }) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className="inline-flex items-center gap-1">
      {stars.map(n => (
        <button key={n} type="button" onClick={() => onChange?.(n)} aria-label={`Rate ${n}`} className={`${size} leading-none`}>
          {n <= value ? "★" : "☆"}
        </button>
      ))}
      <span className="ml-2 text-sm text-slate-500">{value}/{max}</span>
    </div>
  );
}

export default function CafeEdit() {
  const { id } = useParams();
  const nav = useNavigate();

  // loading/error
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // core fields
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const featureList = ["parking","wifi","outlets","work_friendly","time_limit","outdoor_seating"];
  const [features, setFeatures] = useState([]);

  // order (single overall) + arrays for beverages/foods
  const [order, setOrder] = useState({ person: "", rating: 0, notes: "" });
  const [beverages, setBeverages] = useState([{ name: "", price: "", rating: 0, notes: "" }]);
  const [foods, setFoods] = useState([{ name: "", price: "", rating: 0, notes: "" }]);

  // ambience ratings
  const [vibe, setVibe] = useState(0);
  const [staff, setStaff] = useState(0);
  const [seats, setSeats] = useState(0);

  // createdBy (read-only here)
  const [createdBy, setCreatedBy] = useState("");

  // dynamic-row helpers
  const addRow = (setter, empty) => setter(prev => [...prev, empty]);
  const removeRow = (setter, idx) => setter(prev => prev.filter((_, i) => i !== idx));
  const updateRow = (setter, idx, key, val) => setter(prev => prev.map((row, i) => i === idx ? { ...row, [key]: val } : row));

  // totals
  const total = beverages.reduce((s, b) => s + toNumber(b.price), 0) + foods.reduce((s, f) => s + toNumber(f.price), 0);

  // calc overall
  function calcOverall() {
    const nums = [
      order.rating,
      ...beverages.map(b => b.rating).filter(Boolean),
      ...foods.map(f => f.rating).filter(Boolean),
      vibe, staff, seats,
    ].filter(Boolean);
    if (!nums.length) return 0;
    const avg = nums.reduce((a,b) => a+b, 0) / nums.length;
    return Math.round(avg * 10) / 10;
    }

  // fetch existing cafe
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase.from("cafes").select("*").eq("id", id).single();
      if (error) { console.error(error); setErr("Failed to load café."); setLoading(false); return; }

      // prefill
      setName(data.name || "");
      setLocation(data.location || "");
      setDescription(data.description || "");
      setFeatures(Array.isArray(data.features) ? data.features : []);
      setCreatedBy(data.createdBy || "");

      // orders: use first (our schema stores one)
      const o = Array.isArray(data.orders) && data.orders[0] ? data.orders[0] : { person: data.createdBy || "", rating: 0, notes: "" };
      setOrder({ person: o.person || "", rating: o.rating || 0, notes: o.notes || "" });

      setBeverages(Array.isArray(data.beverages) && data.beverages.length ? data.beverages : [{ name: "", price: "", rating: 0, notes: "" }]);
      setFoods(Array.isArray(data.foods) && data.foods.length ? data.foods : [{ name: "", price: "", rating: 0, notes: "" }]);

      setVibe(data?.rating?.vibe || 0);
      setStaff(data?.rating?.staff || 0);
      setSeats(data?.rating?.seats || 0);

      setLoading(false);
    }
    load();
  }, [id]);

  // toggle feature
  const toggleFeature = f => setFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  // save updates
  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) { alert("Name is required"); return; }

    const clean = v => (v ?? "").toString().trim();
    const scrubList = arr =>
      arr
        .filter(x => clean(x.name) || toNumber(x.price) || (x.notes && clean(x.notes)) || (x.rating && x.rating > 0))
        .map(x => ({ name: clean(x.name), price: toNumber(x.price), rating: x.rating || 0, notes: clean(x.notes) }));

    const payload = {
      name: clean(name),
      location: clean(location),
      description: clean(description),
      features,
      rating: { overall: calcOverall(), vibe, staff, seats },
      orders: [{ person: order.person || createdBy || "", rating: order.rating || 0, notes: clean(order.notes) }],
      beverages: scrubList(beverages),
      foods: scrubList(foods),
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase.from("cafes").update(payload).eq("id", id);
    if (error) { console.error(error); alert("Failed to save changes"); return; }
    nav(`/cafes/${id}`);
  }

  if (loading) return <section className="text-slate-500">Loading café…</section>;
  if (err) return (
    <section className="space-y-4">
      <div className="text-red-600">{err}</div>
      <Link to="/cafes" className="text-emerald-600 underline">Back to list</Link>
    </section>
  );

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Edit Café</h1>
          <p className="text-xs text-slate-500 mt-1">Created by {createdBy || "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/cafes/${id}`} className="rounded-lg border px-3 py-2 hover:bg-slate-50">Cancel</Link>
          <button form="edit-cafe-form" className="rounded-lg bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700">Save</button>
        </div>
      </div>

      <form id="edit-cafe-form" onSubmit={handleSave} className="space-y-8">
        {/* Basics */}
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input className="w-full rounded-lg border px-3 py-2" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input className="w-full rounded-lg border px-3 py-2" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea rows={3} className="w-full rounded-lg border px-3 py-2" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
        </div>

        {/* Features */}
        <fieldset>
          <legend className="text-sm font-semibold mb-2">Features</legend>
          <div className="flex flex-wrap gap-2">
            {featureList.map(f => (
              <label key={f} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2">
                <input type="checkbox" checked={features.includes(f)} onChange={() => toggleFeature(f)} />
                <span className="text-sm">{f.replace("_"," ")}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Order (overall) */}
        <Section title={`Order for ${order.person || createdBy || "—"}`}>
          <Card>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Person</label>
                <input className="w-full rounded-lg border px-3 py-2 bg-slate-50" value={order.person || createdBy} onChange={e => setOrder(prev => ({ ...prev, person: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Overall Rating</label>
                <RatingStars value={order.rating} onChange={n => setOrder(prev => ({ ...prev, rating: n }))} />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium mb-1">Overall Experience</label>
              <textarea rows={2} className="w-full rounded-lg border px-3 py-2" value={order.notes} onChange={e => setOrder(prev => ({ ...prev, notes: e.target.value }))} />
            </div>
          </Card>
        </Section>

        {/* Beverages (multiple) */}
        <Section title="Beverages">
          <div className="space-y-3">
            {beverages.map((b, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Drink</label>
                    <input className="w-full rounded-lg border px-3 py-2" value={b.name} onChange={e => updateRow(setBeverages, i, "name", e.target.value)} placeholder="Hazelnut Latte" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Price (₱)</label>
                    <input type="number" min="0" className="w-full rounded-lg border px-3 py-2" value={b.price} onChange={e => updateRow(setBeverages, i, "price", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Rating</label>
                    <RatingStars value={b.rating} onChange={n => updateRow(setBeverages, i, "rating", n)} />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block text-xs font-medium mb-1">Notes</label>
                  <textarea rows={2} className="w-full rounded-lg border px-3 py-2" value={b.notes} onChange={e => updateRow(setBeverages, i, "notes", e.target.value)} />
                </div>
                <div className="mt-2 text-right">
                  <button type="button" onClick={() => removeRow(setBeverages, i)} className="text-sm text-red-600 hover:underline">Remove</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => addRow(setBeverages, { name: "", price: "", rating: 0, notes: "" })} className="mt-2 rounded-lg border px-4 py-2 hover:bg-slate-50">Add drink</button>
          </div>
        </Section>

        {/* Food (multiple) */}
        <Section title="Food">
          <div className="space-y-3">
            {foods.map((f, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Food</label>
                    <input className="w-full rounded-lg border px-3 py-2" value={f.name} onChange={e => updateRow(setFoods, i, "name", e.target.value)} placeholder="Nachos" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Price (₱)</label>
                    <input type="number" min="0" className="w-full rounded-lg border px-3 py-2" value={f.price} onChange={e => updateRow(setFoods, i, "price", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Rating</label>
                    <RatingStars value={f.rating} onChange={n => updateRow(setFoods, i, "rating", n)} />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block text-xs font-medium mb-1">Notes</label>
                  <textarea rows={2} className="w-full rounded-lg border px-3 py-2" value={f.notes} onChange={e => updateRow(setFoods, i, "notes", e.target.value)} />
                </div>
                <div className="mt-2 text-right">
                  <button type="button" onClick={() => removeRow(setFoods, i)} className="text-sm text-red-600 hover:underline">Remove</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => addRow(setFoods, { name: "", price: "", rating: 0, notes: "" })} className="mt-2 rounded-lg border px-4 py-2 hover:bg-slate-50">Add food</button>
          </div>
        </Section>

        {/* Ambience */}
        <Section title="Ambience">
          <Card>
            <div className="grid sm:grid-cols-3 gap-3">
              <div><label className="block text-xs font-medium mb-1">Vibe</label><RatingStars value={vibe} onChange={setVibe} /></div>
              <div><label className="block text-xs font-medium mb-1">Staff</label><RatingStars value={staff} onChange={setStaff} /></div>
              <div><label className="block text-xs font-medium mb-1">Seats</label><RatingStars value={seats} onChange={setSeats} /></div>
            </div>
          </Card>
        </Section>

        {/* Totals + Save bar */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-700">
            Total (Food + Beverages): <b>{formatPHP(total)}</b>
          </div>
          <div className="text-sm text-slate-500">Overall (auto): {calcOverall()}</div>
        </div>
      </form>
    </section>
  );
}