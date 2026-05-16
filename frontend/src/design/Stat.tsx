import { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  tone?: "cyan" | "violet" | "amber" | "green";
}
export default function Stat({ label, value, tone = "cyan" }: Props) {
  return (
    <div className="hud-stat">
      <div className="lbl">{label}</div>
      <div className={`val ${tone === "cyan" ? "" : tone}`}>{value}</div>
    </div>
  );
}
