import { useEffect, useState } from "react";

export default function Typewriter({
  text,
  speed = 28,
  className,
}: {
  text: string;
  speed?: number;
  className?: string;
}) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return (
    <span className={className}>
      {shown}
      <span style={{ opacity: 0.6 }}>▌</span>
    </span>
  );
}
