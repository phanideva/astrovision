import { ReactNode, HTMLAttributes } from "react";

type Tone = "cyan" | "violet" | "amber" | "green";

interface Props extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  grid?: boolean;
  scanlines?: boolean;
  children: ReactNode;
}

export default function HudPanel({
  tone = "cyan",
  grid = false,
  scanlines = false,
  className = "",
  children,
  ...rest
}: Props) {
  const cls = [
    "hud-panel",
    tone !== "cyan" ? tone : "",
    grid ? "hud-grid" : "",
    scanlines ? "hud-scanlines" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}
