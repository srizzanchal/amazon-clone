import { useState } from "react";

export default function Rating({ value = 0, count }) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="rating" title={`${value} out of 5`}>
      <span className="stars" aria-hidden="true">{"★".repeat(full)}{"☆".repeat(5 - full)}</span>
      <span className="sr-only">{value} out of 5 stars</span>
      {count !== undefined && (
        <span className="muted"> {count > 0 ? `(${count.toLocaleString("en-IN")})` : "(no reviews)"}</span>
      )}
    </span>
  );
}

// Clickable 1-5 star picker used in the review form
export function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-input" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          className={n <= (hover || value) ? "on" : ""}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
