import { useParams } from "react-router-dom";

export default function CafeDetail() {
  const { id } = useParams();
  // placeholder detail screen
  return (
    <section className="space-y-2">
      <h2 className="text-2xl font-bold">Café Details</h2>
      <p className="text-slate-500">ID: {id}</p>
      <div className="rounded-xl border p-6 bg-white">
        Coming soon: images, ratings, features, and notes.
      </div>
    </section>
  );
}