import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem("cll-splash-seen");
  });

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setShow(false);
        sessionStorage.setItem("cll-splash-seen", "1");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const handleSkip = () => {
    setShow(false);
    sessionStorage.setItem("cll-splash-seen", "1");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-white via-[oklch(0.97_0.02_350)] to-white cursor-pointer"
          onClick={handleSkip}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-serif font-bold shimmer tracking-tight">
              CLL JOIAS
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-3 text-sm tracking-[0.3em] text-[oklch(0.5_0.06_350)] uppercase"
            >
              @cll.joias
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-4 text-base md:text-lg font-serif italic text-[oklch(0.55_0.08_350)]"
            >
              Elegância que traduz quem você é
            </motion.p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 text-xs text-muted-foreground tracking-wider"
          >
            toque para continuar
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
