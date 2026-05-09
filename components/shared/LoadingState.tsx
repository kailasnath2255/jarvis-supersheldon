type Props = {
  label?: string;
  rows?: number;
};

export function LoadingState({
  label = "Getting things ready…",
  rows = 4,
}: Props) {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <p className="sr-only">{label}</p>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-full bg-ss-ink-200 animate-pulse"
          style={{ width: `${100 - i * 8}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-ss p-6 border border-ss-ink-200 space-y-4">
      <div className="h-6 w-1/3 rounded bg-ss-ink-200 animate-pulse" />
      <div className="h-4 w-full rounded bg-ss-ink-200 animate-pulse" />
      <div className="h-4 w-2/3 rounded bg-ss-ink-200 animate-pulse" />
    </div>
  );
}
