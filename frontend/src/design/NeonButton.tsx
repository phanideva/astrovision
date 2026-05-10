import { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import { Link, LinkProps } from "react-router-dom";

type Tone = "cyan" | "violet" | "amber" | "danger";

interface Common {
  tone?: Tone;
  children: ReactNode;
}

export function NeonButton({
  tone = "cyan",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & Common) {
  return (
    <button className={`neon-btn ${tone === "cyan" ? "" : tone} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function NeonLink({
  tone = "cyan",
  to,
  className = "",
  children,
  ...rest
}: Omit<LinkProps, "to"> & { to: string } & Common) {
  return (
    <Link to={to} className={`neon-btn ${tone === "cyan" ? "" : tone} ${className}`} {...rest}>
      {children}
    </Link>
  );
}

export function NeonAnchor({
  tone = "cyan",
  className = "",
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & Common) {
  return (
    <a className={`neon-btn ${tone === "cyan" ? "" : tone} ${className}`} {...rest}>
      {children}
    </a>
  );
}
