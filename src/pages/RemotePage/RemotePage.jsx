import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./RemotePage.css";

let pusherLib = null;
async function getPusher() {
  if (pusherLib) return pusherLib;
  const mod = await import("pusher-js");
  pusherLib = mod.default;
  return pusherLib;
}

/**
 * The page opened on the phone after scanning the QR code.
 * A full-screen touch area sends scroll-delta events via Pusher
 * which the desktop page listens to.
 */
export default function RemotePage() {
  const [params]     = useSearchParams();
  const { t }        = useTranslation();
  const sessionId    = params.get("session");

  const [status, setStatus] = useState("connecting"); // connecting | ready | error | no-config
  const channelRef   = useRef(null);
  const pusherRef    = useRef(null);
  const lastYRef     = useRef(null);

  useEffect(() => {
    const key     = process.env.REACT_APP_PUSHER_KEY;
    const cluster = process.env.REACT_APP_PUSHER_CLUSTER || "eu";

    if (!key || !sessionId) {
      setStatus("no-config");
      return;
    }

    let cancelled = false;

    getPusher().then((Pusher) => {
      if (cancelled) return;

      const client = new Pusher(key, {
        cluster,
        authEndpoint: "/api/remote-auth",
      });
      pusherRef.current = client;

      const channel = client.subscribe(`private-remote-${sessionId}`);
      channelRef.current = channel;

      channel.bind("pusher:subscription_succeeded", () => {
        if (!cancelled) {
          // Announce our presence to the desktop
          channel.trigger("client-phone-ready", {});
          setStatus("ready");
        }
      });

      channel.bind("pusher:subscription_error", () => {
        if (!cancelled) setStatus("error");
      });
    });

    return () => {
      cancelled = true;
      if (channelRef.current) {
        channelRef.current.trigger?.("client-phone-bye", {});
        channelRef.current.unbind_all();
        pusherRef.current?.unsubscribe(`private-remote-${sessionId}`);
      }
      pusherRef.current?.disconnect();
    };
  }, [sessionId]);

  // Touch handlers
  const handleTouchStart = (e) => {
    lastYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (lastYRef.current === null || !channelRef.current) return;
    const currentY = e.touches[0].clientY;
    const delta    = lastYRef.current - currentY; // positive = scroll down
    lastYRef.current = currentY;
    try {
      channelRef.current.trigger("client-scroll-delta", { delta: delta * 2 });
    } catch {
      // Channel may not support client events if Pusher app is not configured
    }
  };

  const handleTouchEnd = () => {
    lastYRef.current = null;
  };

  return (
    <div className="remote-page">
      <div className="remote-page-header">
        <h1 className="remote-page-title">{t("remote.title", "Phone Remote")}</h1>
        <div className={`remote-page-status remote-page-status--${status}`}>
          {status === "connecting" && t("remote.connecting", "Connecting…")}
          {status === "ready"      && t("remote.connected",  "Connected — swipe to scroll")}
          {status === "error"      && t("remote.error",      "Connection failed")}
          {status === "no-config"  && t("remote.noConfig",   "Remote control not configured")}
        </div>
      </div>

      <div
        className="remote-page-touch-area"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="application"
        aria-label={t("remote.instructions", "Swipe up or down to scroll the portfolio")}
      >
        <div className="remote-page-gesture-hint" aria-hidden="true">
          <div className="remote-page-arrow remote-page-arrow--up">↑</div>
          <div className="remote-page-swipe-text">{t("remote.swipe", "Swipe")}</div>
          <div className="remote-page-arrow remote-page-arrow--down">↓</div>
        </div>
      </div>
    </div>
  );
}
