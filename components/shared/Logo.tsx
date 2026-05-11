/* eslint-disable @next/next/no-img-element */
type Props = {
  /** Height in pixels. Width scales to preserve the logo's natural aspect ratio. */
  size?: number;
  className?: string;
};

export function Logo({ size = 40, className = "" }: Props) {
  return (
    <img
      src="/logo.webp"
      alt="Super Sheldon"
      height={size}
      style={{ height: size, width: "auto" }}
      className={`select-none ${className}`}
      draggable={false}
    />
  );
}
