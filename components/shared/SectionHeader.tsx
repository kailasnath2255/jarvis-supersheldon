type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
};

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: Props) {
  const alignment = align === "center" ? "text-center" : "text-left";
  return (
    <header className={`${alignment} space-y-2`}>
      {eyebrow ? (
        <p className="text-xs font-semibold tracking-[0.18em] text-ss-orange-600 uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-display text-3xl md:text-4xl font-bold text-ss-ink-900">
        {title}
      </h1>
      {subtitle ? (
        <p className="text-ss-ink-500 text-base md:text-lg">{subtitle}</p>
      ) : null}
    </header>
  );
}
