// Placeholder cards shown while products load
export function ProductSkeletons({ count = 8 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }, (_, i) => (
        <div className="card skeleton-card" key={i}>
          <div className="skeleton sk-img" />
          <div className="skeleton sk-line" />
          <div className="skeleton sk-line short" />
          <div className="skeleton sk-line short" />
        </div>
      ))}
    </div>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="spinner-wrap" role="status">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}
