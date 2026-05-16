import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { IconAward } from "@tabler/icons-react";
import { Toast, useToastListener } from "./toast";
import { portalApi } from "../api/portal";
import { useAuth } from "../store/auth";

const AUTO_DISMISS_MS = 6000;

export default function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);
  const { user } = useAuth();

  const removeToast = (id: Toast["id"]) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
  };

  const pushToast = (toast: Toast) => {
    setItems((xs) => [...xs, toast]);
    window.setTimeout(() => {
      removeToast(toast.id);
    }, AUTO_DISMISS_MS);
  };

  useToastListener((t) => {
    pushToast(t);
  });

  useEffect(() => {
    if (!user) return;

    const seen = new Set<number>();
    const run = async () => {
      try {
        const data = await portalApi.listNotifications(true);
        const unread = data.results.slice(0, 3);
        unread.forEach((n) => {
          if (seen.has(n.id)) return;
          seen.add(n.id);
          pushToast({ id: nextToastId(), title: n.title, sub: n.body });
        });
      } catch {
        // ignore polling failures
      }
    };

    run();
    const timer = window.setInterval(run, 60_000);
    return () => window.clearInterval(timer);
  }, [user]);

  return (
    <div style={{ position: "fixed", top: 84, right: 18, zIndex: 80, display: "flex", flexDirection: "column", gap: 10 }}>
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 80, filter: "blur(6px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 80, filter: "blur(6px)" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="av-toast"
            style={{ position: "relative", top: 0, right: 0 }}
          >
            <button
              type="button"
              className="av-toast-close"
              aria-label="Close notification"
              onClick={() => removeToast(t.id)}
            >
              x
            </button>
            <span className="badge"><IconAward size={20} stroke={1.6} /></span>
            <div>
              <div>{t.title}</div>
              {(t.sub || t.message) && (
                <div style={{ color: "#cfeefb", fontSize: 10, marginTop: 4, letterSpacing: 0.2 }}>
                  {t.sub ?? t.message}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

let counter = 0;
export function useToastEmitter() {
  return useEffect;
}

export function nextToastId() {
  counter += 1;
  return `t-${Date.now()}-${counter}`;
}
