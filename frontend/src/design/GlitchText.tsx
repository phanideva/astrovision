import { HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLSpanElement> {
  text: string;
  as?: "span" | "h1" | "h2" | "h3" | "div";
}

export default function GlitchText({ text, as = "span", className = "", ...rest }: Props) {
  const Tag = as as any;
  return (
    <Tag className={`glitch ${className}`} data-text={text} {...rest}>
      {text}
    </Tag>
  );
}
