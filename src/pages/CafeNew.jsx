import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createCafe } from "../services/cafes.api";

// Inline localStorage helpers so this page works even without separate utils
const DB_KEY = "bean-there/db";
function loadDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return { cafes: [], images: [] };
  try { return JSON.parse(raw); } catch { return { cafes: [], images: [] }; }
}
function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}
function generateId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}
function upsertCafe(cafe) {
  const db = loadDB();
  const idx = db.cafes.findIndex((c) => c.id === cafe.id);
  if (idx === -1) db.cafes.push(cafe);
  else db.cafes[idx] = cafe;
  saveDB(db);
}

function featuresToBooleans(list) {
  const set = new Set(list);
  return {
    wifi: set.has("wifi"),
    parking: set.has("parking"),
    outlets: set.has("outlets"),
    work_friendly: set.has("work_friendly"),
    // Not in DB yet, kept for UI only:
    // time_limit: set.has("time_limit"),
    // outdoor_seating: set.has("outdoor_seating"),
  };
}

// Tiny star rating component
function RatingStars({ value = 0, onChange, max = 5, size = "text-xl" }) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className="inline-flex items-center gap-1">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          aria-label={`Rate ${n}`}
          className={`${size} leading-none`}
        >
          {n <= value ? "★" : "☆"}
        </button>
      ))}
      <span className="ml-2 text-sm text-slate-500">{value}/{max}</span>
    </div>
  );
}

export default function CafeNew() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  // Determine who is adding from query param
  const byParam = (searchParams.get("by") || "uyan").toLowerCase();
  const initialBy = byParam === "myc" ? "Myc" : "Uyan";
  const [createdBy, setCreatedBy] = useState(initialBy);

  // Basic fields
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  // Features (checkboxes)
  const featureList = [
    "parking",
    "wifi",
    "outlets",
    "work_friendly",
    "time_limit",
    "outdoor_seating",
  ];
  const [features, setFeatures] = useState([]);
  const toggleFeature = (f) =>
    setFeatures((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  // Single order tied to creator (no quick-note/price; just overall rating + notes)
  const [order, setOrder] = useState({ person: initialBy, rating: 0, notes: "" });

  // MULTIPLE drinks & foods
  const [beverages, setBeverages] = useState([{ name: "", price: "", rating: 0, notes: "" }]);
  const [foods, setFoods] = useState([{ name: "", price: "", rating: 0, notes: "" }]);

  // Extra ambience ratings
  const [vibe, setVibe] = useState(0);
  const [staff, setStaff] = useState(0);
  const [seats, setSeats] = useState(0);

  // Helpers for dynamic rows
  const addRow = (setter, emptyRow) => setter((prev) => [...prev, emptyRow]);
  const removeRow = (setter, idx) => setter((prev) => prev.filter((_, i) => i !== idx));
  const updateRow = (setter, idx, key, val) =>
    setter((prev) => prev.map((row, i) => (i === idx ? { ...row, [key]: val } : row)));

  // Computed helpers
  const toNumber = (v) => (v === "" || v == null ? 0 : Number(v));
  const formatPHP = (n) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n || 0);
  const foodBeverageTotal =
    beverages.reduce((sum, b) => sum + toNumber(b.price), 0) +
    foods.reduce((sum, f) => sum + toNumber(f.price), 0);

  const sanitizeNamePriceRating = (arr) =>
    arr
      .filter((x) => x.name?.trim() || toNumber(x.price) || x.rating > 0 || x.notes?.trim())
      .map((x) => ({
        name: (x.name || "").trim(),
        price: toNumber(x.price),
        rating: x.rating || 0,
        notes: (x.notes || "").trim(),
      }));

  function calcOverall() {
    const nums = [
      order.rating,
      ...beverages.map((b) => b.rating).filter(Boolean),
      ...foods.map((f) => f.rating).filter(Boolean),
      vibe,
      staff,
      seats,
    ].filter(Boolean);
    if (!nums.length) return 0;
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return Math.round(avg * 10) / 10;
  }

  // Save handler
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Café name is required");

    const now = new Date().toISOString();

    // Rich object for local fallback
    const cafeLocal = {
      id: generateId("cf"),
      name: name.trim(),
      location: location.trim(),
      description: description.trim(),
      features,
      rating: { overall: calcOverall(), vibe, staff, seats },
      orders: [
        {
          person: order.person,
          rating: order.rating || 0,
          notes: (order.notes || "").trim(),
        },
      ],
      beverages: sanitizeNamePriceRating(beverages),
      foods: sanitizeNamePriceRating(foods),
      images: [],
      links: [],
      createdAt: now,
      updatedAt: now,
      createdBy,
    };

    // Map features -> booleans for DB schema
    const f = featuresToBooleans(features);

    // Compute simple aggregates for DB schema
    const itemRatings = [
      order.rating,
      ...beverages.map((b) => b.rating).filter(Boolean),
      ...foods.map((x) => x.rating).filter(Boolean),
    ].filter(Boolean);
    const tasteAvg = itemRatings.length
      ? Math.round(itemRatings.reduce((a, b) => a + b, 0) / itemRatings.length)
      : 0;

    const allItems = beverages.concat(foods);
    const avgPrice =
      allItems.reduce((s, x) => s + (Number(x.price) || 0), 0) /
      Math.max(1, allItems.length);
    // naive bucket: 0–100→1, 101–150→2, 151–200→3, 201–250→4, >250→5
    const priceBucket =
      avgPrice <= 100 ? 1 : avgPrice <= 150 ? 2 : avgPrice <= 200 ? 3 : avgPrice <= 250 ? 4 : 5;

    const cafeDB = {
      name: cafeLocal.name,
      location_text: cafeLocal.location,
      description: cafeLocal.description,
      taste: tasteAvg || 0,
      price: priceBucket || 0,
      mood: vibe || 0,
      place: seats || 0,
      wifi: f.wifi,
      parking: f.parking,
      outlets: f.outlets,
      work_friendly: f.work_friendly,
      links: [],   // keep empty for now
      images: [],  // keep empty for now (Storage later)
    };

    try {
      await createCafe(cafeDB); // write to Supabase
    } catch (err) {
      console.error("Supabase save failed, falling back to local:", err);
      upsertCafe(cafeLocal);    // fallback so data isn't lost
    }

    nav("/cafes");
  };

  return (
    <section className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Add a Café</h2>

      {/* Adding as toggle */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-slate-600">Adding as:</span>
        {["Uyan", "Myc"].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setCreatedBy(p);
              setOrder((prev) => ({ ...prev, person: p }));
            }}
            className={`rounded-lg border px-3 py-1.5 ${
              createdBy === p ? "bg-emerald-600 text-white" : "hover:bg-slate-50"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basics */}
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="e.g. Beanhi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Concepcion Uno, Marikina City"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              rows={3}
              placeholder="Our thoughts…"
            />
          </div>
        </div>

        {/* Features */}
        <fieldset>
          <legend className="text-sm font-semibold mb-2">Features</legend>
          <div className="flex flex-wrap gap-2">
            {featureList.map((f) => (
              <label
                key={f}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={features.includes(f)}
                  onChange={() => toggleFeature(f)}
                />
                <span className="text-sm">{f.replaceAll("_", " ")}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Single combined order card */}
        <Section title={`Order for ${createdBy}`}>
          <Card>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Person</label>
                <input
                  className="w-full rounded-lg border px-3 py-2 bg-slate-50"
                  value={order.person}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Overall Rating</label>
                <RatingStars value={order.rating} onChange={(n) => setOrder((prev) => ({ ...prev, rating: n }))} />
              </div>
            </div>

            {/* Beverages (multiple) */}
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Beverages</h4>
              <div className="space-y-3">
                {beverages.map((b, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Drink</label>
                        <input
                          className="w-full rounded-lg border px-3 py-2"
                          placeholder="Hazelnut Latte"
                          value={b.name}
                          onChange={(e) => updateRow(setBeverages, i, "name", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Price (₱)</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full rounded-lg border px-3 py-2"
                          value={b.price}
                          onChange={(e) => updateRow(setBeverages, i, "price", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Rating</label>
                        <RatingStars value={b.rating} onChange={(n) => updateRow(setBeverages, i, "rating", n)} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs font-medium mb-1">Notes</label>
                      <textarea
                        className="w-full rounded-lg border px-3 py-2"
                        rows={2}
                        value={b.notes}
                        onChange={(e) => updateRow(setBeverages, i, "notes", e.target.value)}
                      />
                    </div>
                    <div className="mt-2 text-right">
                      <button type="button" onClick={() => removeRow(setBeverages, i)} className="text-sm text-red-600 hover:underline">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addRow(setBeverages, { name: "", price: "", rating: 0, notes: "" })} className="mt-2 rounded-lg border px-4 py-2 hover:bg-slate-50">Add drink</button>
            </div>

            {/* Foods (multiple) */}
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Food</h4>
              <div className="space-y-3">
                {foods.map((f, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Food</label>
                        <input
                          className="w-full rounded-lg border px-3 py-2"
                          placeholder="Nachos"
                          value={f.name}
                          onChange={(e) => updateRow(setFoods, i, "name", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Price (₱)</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full rounded-lg border px-3 py-2"
                          value={f.price}
                          onChange={(e) => updateRow(setFoods, i, "price", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Rating</label>
                        <RatingStars value={f.rating} onChange={(n) => updateRow(setFoods, i, "rating", n)} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs font-medium mb-1">Notes</label>
                      <textarea
                        className="w-full rounded-lg border px-3 py-2"
                        rows={2}
                        value={f.notes}
                        onChange={(e) => updateRow(setFoods, i, "notes", e.target.value)}
                      />
                    </div>
                    <div className="mt-2 text-right">
                      <button type="button" onClick={() => removeRow(setFoods, i)} className="text-sm text-red-600 hover:underline">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addRow(setFoods, { name: "", price: "", rating: 0, notes: "" })} className="mt-2 rounded-lg border px-4 py-2 hover:bg-slate-50">Add food</button>
            </div>

            {/* Ambience ratings */}
            <div className="mt-6 grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Vibe</label>
                <RatingStars value={vibe} onChange={setVibe} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Staff</label>
                <RatingStars value={staff} onChange={setStaff} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Seats</label>
                <RatingStars value={seats} onChange={setSeats} />
              </div>
            </div>

            {/* Order notes */}
            <div className="mt-4">
              <label className="block text-xs font-medium mb-1">Overall Experience</label>
              <textarea
                className="w-full rounded-lg border px-3 py-2"
                rows={2}
                value={order.notes}
                onChange={(e) => setOrder((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </Card>
        </Section>

        {/* Totals */}
        <div className="flex items-center justify-end text-sm text-slate-700">
          <span className="mr-2">Total (Food + Beverage):</span>
          <strong>{formatPHP(foodBeverageTotal)}</strong>
        </div>

        {/* Save */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Overall (auto): {calcOverall()}</p>
          <button className="rounded-lg bg-emerald-600 text-white px-5 py-2 hover:bg-emerald-700">
            Save Café
          </button>
        </div>
      </form>
    </section>
  );
}

function Section({ title, children }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-lg font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function Card({ children }) {
  return <div className="rounded-xl border bg-white p-4">{children}</div>;
}