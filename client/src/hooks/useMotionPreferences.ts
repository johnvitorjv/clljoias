import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

type MotionPreferences = {
  reducedMotion: boolean;
  allowRichMotion: boolean;
  allowHoverEffects: boolean;
};

export function useMotionPreferences(): MotionPreferences {
  const reducedMotionPreferred = useReducedMotion();
  const [allowRichMotion, setAllowRichMotion] = useState(false);
  const [allowHoverEffects, setAllowHoverEffects] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const largeScreen = window.matchMedia("(min-width: 1024px)").matches;
    const hasPreciseHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const hasCpuHeadroom = (navigator.hardwareConcurrency || 0) >= 4;
    const memory = "deviceMemory" in navigator ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 0 : 0;
    const hasMemoryHeadroom = memory === 0 || memory >= 4;

    setAllowHoverEffects(largeScreen && hasPreciseHover);
    setAllowRichMotion(largeScreen && hasPreciseHover && hasCpuHeadroom && hasMemoryHeadroom);
  }, []);

  const reducedMotion = Boolean(reducedMotionPreferred);

  return {
    reducedMotion,
    allowRichMotion: allowRichMotion && !reducedMotion,
    allowHoverEffects: allowHoverEffects && !reducedMotion,
  };
}
