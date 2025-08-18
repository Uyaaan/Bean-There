import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    setFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  // Item-level ratings
  const [orders, setOrders] = useState([
    { person: "Uyan", item: "", rating: 0, notes: "" },
    { person: "Myc", item: "", rating: 0, notes: "" },
  ]);
  const [beverages, setBeverages] = useState([
    { name: "", rating: 0, notes: "" },
  ]);
  const [foods, setFoods] = useState([{ name: "", rating: 0, notes: "" }]);
  const [prices, setPrices] = useState([
    { name: "", price: "", valueRating: 0, notes: "" },
  ]);

  // Row helpers
  const addRow = (setter, emptyRow) =>
    setter((prev) => [...prev, emptyRow]);
  const removeRow = (setter, idx) =>
    setter((prev) => prev.filter((_, i) => i !== idx));
  const updateRow = (setter, idx, key, val) =>
    setter((prev) => prev.map((row, i) => (i === idx ? { ...row, [key]: val } : row)));

  // Save handler
  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Café name is required");

    const now = new Date().toISOString();
    const cafe = {
      id: generateId("cf"),
      name: name.trim(),
      location: location.trim(),
      description: description.trim(),
      features,
      rating: { overall: calcOverall() },
      orders: sanitizeOrders(orders),
      beverages: sanitizeNameRating(beverages),
      foods: sanitizeNameRating(foods),
      prices: sanitizePrices(prices),
      images: [],
      links: [],
      createdAt: now,
      updatedAt: now,
      createdBy: "you",
    };

    upsertCafe(cafe);
    nav("/cafes");
  };

  // Helpers for overall rating + cleanup
  function calcOverall() {
    const nums = [
      ...orders.map((o) => o.rating).filter(Boolean),
      ...beverages.map((b) => b.rating).filter(Boolean),
      ...foods.map((f) => f.rating).filter(Boolean),
      ...prices.map((p) => p.valueRating).filter(Boolean),
    ];
    if (!nums.length) return 0;
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return Math.round(avg * 10) / 10; // 1 decimal place
  }

  const sanitizeNameRating = (arr) =>
    arr
      .filter((x) => x.name?.trim())
      .map((x) => ({ ...x, name: x.name.trim() }));

  const sanitizeOrders = (arr) =>
    arr
      .filter((x) => x.item?.trim() || x.rating > 0)
      .map((x) => ({
        person: x.person?.trim() || "Unknown",
        item: x.item.trim(),
        rating: x.rating || 0,
        notes: x.notes?.trim() || "",
      }));

  const sanitizePrices = (arr) =>
    arr
      .filter((x) => x.name?.trim())
      .map((x) => ({
        name: x.name.trim(),
        price: Number(x.price) || 0,
        valueRating: x.valueRating || 0,
        notes: x.notes?.trim() || "",
      }));

  return (
    <section className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Add a Café</h2>

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
                <span className="text-sm">{f.replace("_", " ")}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Orders (per person) */}
        <Section title="RATINGS – Orders">
          {orders.map((o, i) => (
            <Card key={i}>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Person</label>
                  <input
                    className="w-full rounded-lg border px-3 py-2"
                    value={o.person}
                    onChange={(e) => updateRow(setOrders, i, "person", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Order (what did they get?)</label>
                  <input
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Iced latte"
                    value={o.item}
                    onChange={(e) => updateRow(setOrders, i, "item", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <span className="block text-xs font-medium mb-1">Rating</span>
                  <RatingStars
                    value={o.rating}
                    onChange={(n) => updateRow(setOrders, i, "rating", n)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(setOrders, i)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="mt-2">
                <label className="block text-xs font-medium mb-1">Description</label>
                <textarea
                  className="w-full rounded-lg border px-3 py-2"
                  rows={2}
                  value={o.notes}
                  onChange={(e) => updateRow(setOrders, i, "notes", e.target.value)}
                />
              </div>
            </Card>
          ))}
          <AddButton
            onClick={() =>
              addRow(setOrders, { person: "", item: "", rating: 0, notes: "" })
            }
          >
            Add another order
          </AddButton>
        </Section>

        {/* Beverages */}
        <Section title="Beverages">
          {beverages.map((b, i) => (
            <Card key={i}>
              <div className="grid sm:grid-cols-2 gap-3">
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
                  <label className="block text-xs font-medium mb-1">Rating</label>
                  <RatingStars
                    value={b.rating}
                    onChange={(n) => updateRow(setBeverages, i, "rating", n)}
                  />
                </div>
              </div>
              <div className="mt-2">
                <label className="block text-xs font-medium mb-1">Description</label>
                <textarea
                  className="w-full rounded-lg border px-3 py-2"
                  rows={2}
                  value={b.notes}
                  onChange={(e) => updateRow(setBeverages, i, "notes", e.target.value)}
                />
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => removeRow(setBeverages, i)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </Card>
          ))}
          <AddButton
            onClick={() => addRow(setBeverages, { name: "", rating: 0, notes: "" })}
          >
            Add a drink
          </AddButton>
        </Section>

        {/* Foods */}
        <Section title="Food">
          {foods.map((f, i) => (
            <Card key={i}>
              <div className="grid sm:grid-cols-2 gap-3">
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
                  <label className="block text-xs font-medium mb-1">Rating</label>
                  <RatingStars
                    value={f.rating}
                    onChange={(n) => updateRow(setFoods, i, "rating", n)}
                  />
                </div>
              </div>
              <div className="mt-2">
                <label className="block text-xs font-medium mb-1">Description</label>
                <textarea
                  className="w-full rounded-lg border px-3 py-2"
                  rows={2}
                  value={f.notes}
                  onChange={(e) => updateRow(setFoods, i, "notes", e.target.value)}
                />
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => removeRow(setFoods, i)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </Card>
          ))}
          <AddButton
            onClick={() => addRow(setFoods, { name: "", rating: 0, notes: "" })}
          >
            Add a food
          </AddButton>
        </Section>

        {/* Prices */}
        <Section title="Price">
          {prices.map((p, i) => (
            <Card key={i}>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Item</label>
                  <input
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Hazelnut add-on"
                    value={p.name}
                    onChange={(e) => updateRow(setPrices, i, "name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Price (₱)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border px-3 py-2"
                    value={p.price}
                    onChange={(e) => updateRow(setPrices, i, "price", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Price Rating</label>
                  <RatingStars
                    value={p.valueRating}
                    onChange={(n) => updateRow(setPrices, i, "valueRating", n)}
                  />
                </div>
              </div>
              <div className="mt-2">
                <label className="block text-xs font-medium mb-1">Description</label>
                <textarea
                  className="w-full rounded-lg border px-3 py-2"
                  rows={2}
                  value={p.notes}
                  onChange={(e) => updateRow(setPrices, i, "notes", e.target.value)}
                />
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => removeRow(setPrices, i)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </Card>
          ))}
          <AddButton
            onClick={() =>
              addRow(setPrices, { name: "", price: "", valueRating: 0, notes: "" })
            }
          >
            Add a price item
          </AddButton>
        </Section>

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

function AddButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 rounded-lg border px-4 py-2 hover:bg-slate-50"
    >
      {children}
    </button>
  );
}