import '../styles/skeleton.css';

export function SkeletonLine({ width = '100%', height = '16px', style = {} }) {
  return (
    <div
      className="skeleton"
      aria-hidden="true"
      style={{ width, height, borderRadius: '6px', ...style }}
    />
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <SkeletonLine width="60%" height="20px" />
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? '75%' : '100%'} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="skeleton-table" aria-hidden="true" aria-label="Loading…">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="skeleton-row">
          {Array.from({ length: cols }, (_, c) => (
            <SkeletonLine key={c} width={c === 0 ? '40%' : '80%'} />
          ))}
        </div>
      ))}
    </div>
  );
}
