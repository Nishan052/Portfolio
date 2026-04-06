import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import useRemoteControl from "../../../hooks/useRemoteControl";
import "./RemoteControl.css";

/**
 * Floating pill in the bottom-right that expands to show a QR code.
 * Scanning the QR on a phone opens the /remote page which lets the
 * phone control the desktop scroll via Pusher.
 */
export default function RemoteControl() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { sessionId, connected, phoneConnected } = useRemoteControl();

  const remoteUrl = `${window.location.origin}/remote?session=${sessionId}`;

  // Only render if Pusher is configured
  if (!process.env.REACT_APP_PUSHER_KEY) return null;

  return (
    <div className={`remote-control${open ? " remote-control--open" : ""}`}>
      {open && (
        <div className="remote-control-panel" role="dialog" aria-label={t("remote.title", "Phone Remote")}>
          <div className="remote-qr-wrapper">
            <QRCodeSVG
              value={remoteUrl}
              size={160}
              bgColor="transparent"
              fgColor="var(--accent)"
              level="M"
            />
          </div>
          <p className="remote-status">
            {phoneConnected
              ? t("remote.connected", "Phone connected")
              : t("remote.scanQr", "Scan to control scroll")}
          </p>
          <p className="remote-hint">
            {t("remote.instructions", "Swipe up/down on your phone to scroll this page")}
          </p>
        </div>
      )}

      <button
        type="button"
        className="remote-trigger"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-label={t("a11y.remoteControl", "Open phone remote control")}
      >
        <span className={`remote-dot${connected ? " remote-dot--connected" : ""}${phoneConnected ? " remote-dot--phone" : ""}`} aria-hidden="true" />
        <span className="remote-trigger-icon" aria-hidden="true">📱</span>
        {open ? "✕" : t("remote.title", "Remote")}
      </button>
    </div>
  );
}
