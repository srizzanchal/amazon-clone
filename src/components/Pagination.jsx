// Compact pager: first, last, and a window around the current page
export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>‹ Prev</button>
      {nums.map((n, i) => (
        <span key={n}>
          {i > 0 && n - nums[i - 1] > 1 && <span className="muted">…</span>}
          <button className={`btn ${n === page ? "btn-orange" : ""}`} aria-current={n === page ? "page" : undefined} onClick={() => onChange(n)}>{n}</button>
        </span>
      ))}
      <button className="btn" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next ›</button>
    </nav>
  );
}
