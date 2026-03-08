/**
 * Two large blurred colour blobs that sit behind all content.
 * They shift colour between dark and light mode.
 */
const FloatingOrbs = ({ isDark }) => (
  <>
    <div
      className="orb"
      style={{
        width: 460, height: 460,
        top: "-8%", left: "-8%",
        background: isDark
          ? "rgba(0,229,255,0.025)"
          : "rgba(37,99,235,0.04)",
      }}
    />
    <div
      className="orb"
      style={{
        width: 360, height: 360,
        bottom: "18%", right: "-6%",
        background: isDark
          ? "rgba(168,85,247,0.03)"
          : "rgba(124,58,237,0.04)",
      }}
    />
  </>
);

export default FloatingOrbs;
