import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const KEY = "av_boot_seen";

const LINES = [
  "INITIALIZING ASTROVISION CORE",
  "LINKING NASA APOD · SDO · ISS · NEO",
  "SPOOLING NEURAL CLASSIFIER",
  "TRANSMISSION ESTABLISHED",
];

export default function BootSplash() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem(KEY);
  });
  const [step, setStep] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!show) return;
    if (reduced) {
      finish();
      return;
    }
    const stepId = setInterval(() => {
      setStep((s) => (s < LINES.length - 1 ? s + 1 : s));
    }, 380);
    const closeId = setTimeout(finish, 1900);
    return () => {
      clearInterval(stepId);
      clearTimeout(closeId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  function finish() {
    try { sessionStorage.setItem(KEY, "1"); } catch { /* ignore */ }
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="av-boot"
          onClick={finish}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(20px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="ring" aria-hidden />
          <div className="lines">
            {LINES.slice(0, step + 1).map((l, i) => (
              <div key={i}>
                <span style={{ color: i === step ? "var(--av-cyan)" : "#7fc6e0" }}>
                  ▶ {l}
                </span>
              </div>
            ))}
          </div>
          <div className="skip">CLICK TO SKIP</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
