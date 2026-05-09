type Props = { size?: number; withWordmark?: boolean };

export function Logo({ size = 40, withWordmark = true }: Props) {
  return (
    <div className="inline-flex items-center gap-3">
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center rounded-2xl bg-ss-orange-500 text-white font-display font-extrabold shadow-ss-brand"
        style={{ width: size, height: size, fontSize: size * 0.55 }}
      >
        S
      </span>
      {withWordmark ? (
        <span className="font-display font-bold text-ss-ink-900 text-lg">
          Super Sheldon
        </span>
      ) : null}
    </div>
  );
}
