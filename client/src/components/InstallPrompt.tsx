import { useState, useEffect, useCallback } from "react";

// ─── Platform Detection ────────────────────────────────────────────
function getDeviceInfo() {
    const ua = navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
        || (navigator as any).standalone === true;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|Chrome/.test(ua);
    return { isIOS, isAndroid, isStandalone, isSafari };
}

const DISMISS_KEY = "cll-install-dismissed";
const DISMISS_DAYS = 7;

function wasDismissedRecently(): boolean {
    try {
        const ts = localStorage.getItem(DISMISS_KEY);
        if (!ts) return false;
        const diff = Date.now() - parseInt(ts, 10);
        return diff < DISMISS_DAYS * 24 * 60 * 60 * 1000;
    } catch {
        return false;
    }
}

function saveDismiss() {
    try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch { }
}

// ─── Component ─────────────────────────────────────────────────────
export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showChromium, setShowChromium] = useState(false);
    const [showIOS, setShowIOS] = useState(false);
    const [closing, setClosing] = useState(false);

    const { isIOS, isStandalone, isSafari } = getDeviceInfo();

    // ── beforeinstallprompt (Chromium) ──
    useEffect(() => {
        if (isStandalone || wasDismissedRecently()) return;

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowChromium(true);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, [isStandalone]);

    // ── iOS fallback ──
    useEffect(() => {
        if (isStandalone || wasDismissedRecently()) return;
        if (isIOS && isSafari) {
            // Show after 2s for a non-intrusive experience
            const timer = setTimeout(() => setShowIOS(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [isIOS, isSafari, isStandalone]);

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setShowChromium(false);
        }
        setDeferredPrompt(null);
        saveDismiss();
    }, [deferredPrompt]);

    const handleDismiss = useCallback(() => {
        setClosing(true);
        saveDismiss();
        setTimeout(() => {
            setShowChromium(false);
            setShowIOS(false);
            setClosing(false);
        }, 400);
    }, []);

    // ─── Nothing to show ──────────────────────────────
    if (!showChromium && !showIOS) return null;

    return (
        <div
            style={{
                position: "fixed",
                bottom: "80px",
                left: "50%",
                transform: `translateX(-50%) translateY(${closing ? "120%" : "0"})`,
                zIndex: 9999,
                width: "min(92vw, 400px)",
                opacity: closing ? 0 : 1,
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                pointerEvents: closing ? "none" : "auto",
            }}
        >
            <div
                style={{
                    background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)",
                    borderRadius: "20px",
                    padding: "20px",
                    boxShadow: "0 8px 32px rgba(192, 96, 128, 0.25), 0 2px 8px rgba(0,0,0,0.08)",
                    border: "1px solid rgba(192, 96, 128, 0.15)",
                    backdropFilter: "blur(12px)",
                    position: "relative",
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    aria-label="Fechar"
                    style={{
                        position: "absolute",
                        top: "10px",
                        right: "12px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#9ca3af",
                        fontSize: "18px",
                        lineHeight: 1,
                        padding: "4px",
                    }}
                >
                    ✕
                </button>

                {/* Header with icon */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
                    <div
                        style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            overflow: "hidden",
                            flexShrink: 0,
                            boxShadow: "0 2px 8px rgba(192, 96, 128, 0.3)",
                        }}
                    >
                        <img
                            src="/icons/icon-192.png"
                            alt="CLL Joias"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    </div>
                    <div>
                        <h3
                            style={{
                                margin: 0,
                                fontSize: "15px",
                                fontWeight: 600,
                                color: "#831843",
                                fontFamily: "'Playfair Display', serif",
                                letterSpacing: "0.02em",
                            }}
                        >
                            Tenha a CLL Joias com você
                        </h3>
                        <p
                            style={{
                                margin: "2px 0 0",
                                fontSize: "12.5px",
                                color: "#6b7280",
                                lineHeight: 1.4,
                            }}
                        >
                            {showIOS
                                ? "Adicione à sua tela inicial para acesso rápido"
                                : "Instale o app para uma experiência completa"}
                        </p>
                    </div>
                </div>

                {/* ── Chromium: Real install button ── */}
                {showChromium && (
                    <button
                        onClick={handleInstall}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            width: "100%",
                            padding: "12px 16px",
                            background: "linear-gradient(135deg, #c06080 0%, #a0506c 100%)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "12px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "'Inter', sans-serif",
                            letterSpacing: "0.02em",
                            boxShadow: "0 4px 14px rgba(192, 96, 128, 0.35)",
                            transition: "transform 0.2s, box-shadow 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            (e.target as HTMLElement).style.transform = "scale(1.02)";
                            (e.target as HTMLElement).style.boxShadow = "0 6px 20px rgba(192, 96, 128, 0.45)";
                        }}
                        onMouseLeave={(e) => {
                            (e.target as HTMLElement).style.transform = "scale(1)";
                            (e.target as HTMLElement).style.boxShadow = "0 4px 14px rgba(192, 96, 128, 0.35)";
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Instalar App
                    </button>
                )}

                {/* ── iOS: Instructions fallback ── */}
                {showIOS && (
                    <div
                        style={{
                            background: "rgba(255,255,255,0.7)",
                            borderRadius: "12px",
                            padding: "12px 14px",
                            fontSize: "13px",
                            color: "#4b5563",
                            lineHeight: 1.6,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                            <span style={{ fontSize: "16px", flexShrink: 0 }}>1.</span>
                            <span>
                                Toque em{" "}
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#2563eb"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ display: "inline-block", verticalAlign: "text-bottom" }}
                                >
                                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                                    <polyline points="16 6 12 2 8 6" />
                                    <line x1="12" y1="2" x2="12" y2="15" />
                                </svg>{" "}
                                <strong>Compartilhar</strong>
                            </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                            <span style={{ fontSize: "16px", flexShrink: 0 }}>2.</span>
                            <span>
                                Selecione <strong>"Adicionar à Tela de Início"</strong>{" "}
                                <span style={{ fontSize: "16px" }}>➕</span>
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
