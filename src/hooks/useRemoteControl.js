import { useState, useEffect, useRef, useCallback } from "react";

let pusherLib = null;

async function getPusher() {
  if (pusherLib) return pusherLib;
  const mod = await import("pusher-js");
  pusherLib = mod.default;
  return pusherLib;
}

function generateSessionId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Sets up the desktop side of the QR phone control feature.
 * - Generates/retrieves a session UUID from sessionStorage.
 * - Subscribes to a Pusher private channel.
 * - On scroll-delta events from the phone, calls window.scrollBy.
 *
 * @returns {{ sessionId, connected, phoneConnected, disconnect }}
 */
export default function useRemoteControl() {
  const [connected,      setConnected]      = useState(false);
  const [phoneConnected, setPhoneConnected] = useState(false);
  const channelRef = useRef(null);
  const pusherRef  = useRef(null);

  const sessionId = useRef(
    sessionStorage.getItem("remoteSessionId") || (() => {
      const id = generateSessionId();
      sessionStorage.setItem("remoteSessionId", id);
      return id;
    })()
  ).current;

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unbind_all();
      pusherRef.current?.unsubscribe(`private-remote-${sessionId}`);
      channelRef.current = null;
    }
    if (pusherRef.current) {
      pusherRef.current.disconnect();
      pusherRef.current = null;
    }
    setConnected(false);
    setPhoneConnected(false);
  }, [sessionId]);

  useEffect(() => {
    const key     = process.env.REACT_APP_PUSHER_KEY;
    const cluster = process.env.REACT_APP_PUSHER_CLUSTER || "eu";

    // Skip if Pusher is not configured
    if (!key) return;

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
        if (!cancelled) setConnected(true);
      });

      channel.bind("pusher:subscription_error", () => {
        if (!cancelled) setConnected(false);
      });

      // Phone connects → sends a phone-ready event
      channel.bind("phone-ready", () => {
        if (!cancelled) setPhoneConnected(true);
      });

      // Phone disconnects
      channel.bind("phone-bye", () => {
        if (!cancelled) setPhoneConnected(false);
      });

      // Scroll delta from phone
      channel.bind("client-scroll-delta", ({ delta }) => {
        if (typeof delta === "number") {
          window.scrollBy({ top: delta * 0.8, behavior: "auto" });
        }
      });
    });

    return () => {
      cancelled = true;
      disconnect();
    };
  }, [sessionId, disconnect]);

  return { sessionId, connected, phoneConnected, disconnect };
}
