export default function RatingStars({ value = 0, onChange, max = 5, size = "text-xl" }) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className="inline-flex items-center gap-1">
      {stars.map(n => (
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