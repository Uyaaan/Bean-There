
export default function CafeNew() {
  return (
    <section className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Add a Café</h2>

      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input className="w-full rounded-lg border px-3 py-2" placeholder="e.g. Beanhi" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input className="w-full rounded-lg border px-3 py-2" placeholder="Concepcion Uno, Marikina City" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea className="w-full rounded-lg border px-3 py-2" rows="4" placeholder="Our thoughts…" />
        </div>

        <div className="flex flex-wrap gap-2">
          {["Parking","WiFi","Outlets","Work_friendly","Time_limit","Outdoor_seating"].map(f => (
            <label key={f} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2">
              <input type="checkbox" /> <span className="text-sm">{f.replace("_"," ")}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button type="button" className="rounded-lg bg-slate-100 px-3 py-2">
            Add Image
          </button>
          <button type="button" className="rounded-lg bg-slate-100 px-3 py-2">
            Add Link
          </button>
        </div>

        <button className="rounded-lg bg-emerald-600 text-white px-5 py-2 hover:bg-emerald-700">
          Save
        </button>
      </form>
    </section>
  );
}