import { useState } from "react";
import { useTranslation } from "react-i18next";
import useRemoteControl from "../../../hooks/useRemoteControl";
import "./RemoteControl.css";

const hasConfig = !!process.env.REACT_APP_PUSHER_KEY;

/**
 * Floating pill in the bottom-right that expands to show a QR code.
 * Always visible. When Pusher is not configured, shows a setup notice.
 */
export default function RemoteControl() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { sessionId, connected, phoneConnected } = useRemoteControl();

  const remoteUrl = hasConfig
    ? `${window.location.origin}/remote?session=${sessionId}`
    : null;

  // Lazy-load QRCodeSVG only when Pusher is configured and panel is open
  const QRBlock = hasConfig && open ? (() => {
    // eslint-disable-next-line global-require
    const { QRCodeSVG } = require("qrcode.react");
    return (
      <div className="remote-qr-wrapper">
        <QRCodeSVG
          value={remoteUrl}
          size={160}
          bgColor="transparent"
          fgColor="var(--accent)"
          level="M"
        />
      </div>
    );
  })() : null;

  return (
    <div className={`remote-control${open ? " remote-control--open" : ""}`}>
      {open && (
        <div className="remote-control-panel" role="dialog" aria-label={t("remote.title", "Phone Remote")}>
          {hasConfig ? (
            <>
              {QRBlock}
              <p className="remote-status">
                {phoneConnected
                  ? t("remote.connected", "Phone connected")
                  : t("remote.scanQr", "Scan to control scroll")}
              </p>
              <p className="remote-hint">
                {t("remote.instructions", "Swipe up/down on your phone to scroll this page")}
              </p>
            </>
          ) : (
            <div className="remote-setup-notice">
              <div className="remote-setup-icon" aria-hidden="true">📱</div>
              <p className="remote-setup-title">Phone Remote</p>
              <p className="remote-setup-desc">
                Add <code>REACT_APP_PUSHER_KEY</code> to <code>.env.local</code> to enable scroll control from your phone.
              </p>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        className="remote-trigger"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-label={t("a11y.remoteControl", "Open phone remote control")}
      >
        <span
          className={`remote-dot${connected ? " remote-dot--connected" : ""}${phoneConnected ? " remote-dot--phone" : ""}`}
          aria-hidden="true"
        />
        <span className="remote-trigger-icon" aria-hidden="true">📱</span>
        {open ? "✕" : t("remote.title", "Remote")}
      </button>
    </div>
  );
}
