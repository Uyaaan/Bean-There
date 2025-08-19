import { useNavigate } from "react-router-dom";

export default function Home() {
  const nav = useNavigate();

  return (
    <section className="grid place-items-center py-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-emerald-600">
          Bean There ☕
        </h1>
        <p className="text-slate-600 max-w-prose mx-auto">
          Welcome to Bean There! for me and Myc to share our favorite cafés. Kahit onti palang ang nasusubukan {">"}.{"<"}
        </p>
        <div className="pt-4 flex gap-3 justify-center">
          <button
            onClick={() => nav("/cafes/new?by=uyan")}
            className="rounded-lg bg-emerald-600 text-white px-5 py-3 hover:bg-emerald-700"
          >
            Add as Uyan
          </button>
          <button
            onClick={() => nav("/cafes/new?by=myc")}
            className="rounded-lg bg-emerald-600 text-white px-5 py-3 hover:bg-emerald-700"
          >
            Add as Myc
          </button>
        </div>
      </div>
    </section>
  );
}