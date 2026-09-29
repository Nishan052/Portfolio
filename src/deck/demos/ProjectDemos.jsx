/* Small looping SVG demos for the six project cards. Pure markup: every animation lives in
   demos.css (dk-d-*, dk-f-*, dk-c-*), so these components hold no state. Captions come from i18n
   (deck.demos.*) through the `t` prop. */

const MONO = { fontFamily: "Geist Mono, monospace" };

/** Tiny seeded PRNG so the generated candles/bars are the same on every render and every visit. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const Frame = ({ children }) => (
  <svg viewBox="0 0 424 150" preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden="true">{children}</svg>
);

/** RAG: a question, three retrieved chunks lighting in turn, and a grounded answer being written. */
export const DemoRag = ({ t }) => (
  <Frame>
    <rect x="20" y="14" width="176" height="30" rx="15" stroke="currentColor" strokeOpacity=".55" />
    <rect x="36" y="26" width="72" height="6" rx="3" fill="currentColor" fillOpacity=".55" />
    {[0, 1, 2].map((k) => (
      <rect key={k} className={`dk-d-rg${k ? ` dk-d-rg${k}` : ""}`} x="20" y={58 + k * 30} width={156 - k * 16} height="22" rx="7" />
    ))}
    <path className="dk-d-flow dk-a-str" d="M182,70 C216,70 208,86 240,86" strokeWidth="1.5" />
    <path className="dk-d-flow dk-a-str" d="M166,100 C210,100 208,94 240,94" strokeWidth="1.5" />
    <rect x="240" y="34" width="164" height="94" rx="16" className="dk-a-str" strokeWidth="1.6" />
    <rect className="dk-d-type dk-a-fill" x="256" y="54" width="130" height="8" rx="4" />
    <rect className="dk-d-type dk-d-type2 dk-a-fill" x="256" y="74" width="108" height="8" rx="4" />
    <rect className="dk-d-type dk-d-type3 dk-a-fill" x="256" y="94" width="84" height="8" rx="4" />
    <text x="256" y="120" className="dk-m-fill" style={MONO} fontSize="10">{t("deck.demos.grounded")}</text>
  </Frame>
);

const CANDLES = (() => {
  const rnd = seeded(11), out = [];
  let y = 96;
  for (let k = 0; k < 17; k++) {
    const o = y, c = y + (rnd() * 28 - 16) - (k > 0 ? 2.2 : 0);
    const hi = Math.min(o, c) - (3 + rnd() * 7), lo = Math.max(o, c) + (3 + rnd() * 7);
    out.push({ k, x: 26 + k * 22, hi, lo, top: Math.min(o, c), h: Math.max(3, Math.abs(o - c)), fc: k >= 12 });
    y = c;
  }
  return out;
})();

/** Forecasting: candlesticks with an accented forecast that keeps appearing. */
export const DemoCandles = ({ t }) => (
  <Frame>
    <path d="M14,134 H410" stroke="currentColor" strokeOpacity=".2" />
    {CANDLES.map((c) => {
      const cls = c.fc ? `dk-c-fc dk-c-fc${c.k - 11}` : "dk-c-up";
      return (
        <g key={c.k}>
          <line x1={c.x + 5} y1={c.hi.toFixed(1)} x2={c.x + 5} y2={c.lo.toFixed(1)} stroke={c.fc ? "var(--brand)" : "currentColor"} strokeWidth="1.5" className={c.fc ? cls : undefined} />
          <rect className={cls} x={c.x} y={c.top.toFixed(1)} width="10" height={c.h.toFixed(1)} rx="1.5" />
        </g>
      );
    })}
    <text x="26" y="20" className="dk-m-fill" style={MONO} fontSize="11">{t("deck.demos.history")}</text>
    <text x="330" y="20" className="dk-a-fill" style={MONO} fontSize="11">{t("deck.demos.forecast")}</text>
  </Frame>
);

/** On-device detection: a plain silhouette in a bounding box, a scan line, and an inference readout.
    No facial features are drawn; it matches the real pipeline (small CNN, INT8, TFLite Micro on Arduino). */
export const DemoPerson = ({ t }) => {
  const cx = 96, cy = 78, b = 48, a = 12;
  return (
    <Frame>
      <circle cx={cx} cy={cy - 14} r="16" fill="currentColor" />
      <path d={`M${cx - 27},${cy + 40} C${cx - 27},${cy + 12} ${cx - 15},${cy + 3} ${cx},${cy + 3} C${cx + 15},${cy + 3} ${cx + 27},${cy + 12} ${cx + 27},${cy + 40} Z`} fill="currentColor" />
      <path className="dk-f-box dk-a-str" strokeWidth="2" d={`M${cx - b},${cy - b + a} V${cy - b} H${cx - b + a} M${cx + b - a},${cy - b} H${cx + b} V${cy - b + a} M${cx + b},${cy + b - a} V${cy + b} H${cx + b - a} M${cx - b + a},${cy + b} H${cx - b} V${cy + b - a}`} />
      <rect className="dk-f-scan dk-a-fill" x={cx - b} y={cy - b - 4} width={2 * b} height="3" rx="1.5" />
      <circle className="dk-f-lm dk-a-fill" cx={cx + b + 6} cy={cy - b - 2} r="4" />
      <text className="dk-f-wait dk-m-fill" x="210" y="52" style={MONO} fontSize="13">{t("deck.demos.scanning")}</text>
      <text className="dk-f-ok dk-a-fill" x="210" y="52" style={MONO} fontSize="15" fontWeight="500">{t("deck.demos.detected")}</text>
      <text x="210" y="82" className="dk-m-fill" style={MONO} fontSize="11">{t("deck.demos.quantised")}</text>
      <text x="210" y="102" className="dk-m-fill" style={MONO} fontSize="11">{t("deck.demos.onDevice")}</text>
    </Frame>
  );
};

/** MQTT pub/sub: a publisher, the broker, two subscribers, packets travelling between them. */
export const DemoSignal = ({ t }) => (
  <Frame>
    <path d="M61,75 H198 M226,71 L363,39 M226,79 L363,111" stroke="currentColor" strokeOpacity=".3" />
    <circle cx="52" cy="75" r="9" stroke="currentColor" strokeWidth="1.5" />
    <circle className="dk-a-fill" cx="212" cy="75" r="14" />
    <circle cx="372" cy="36" r="9" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="372" cy="114" r="9" stroke="currentColor" strokeWidth="1.5" />
    <circle className="dk-d-pk dk-d-pk1 dk-a-fill" cx="61" cy="75" r="4" />
    <circle className="dk-d-pk dk-d-pk2 dk-a-fill" cx="226" cy="71" r="4" />
    <circle className="dk-d-pk dk-d-pk3 dk-a-fill" cx="226" cy="79" r="4" />
    <text x="26" y="22" className="dk-m-fill" style={MONO} fontSize="12">{t("deck.demos.topic")}</text>
  </Frame>
);

const BARS = (() => {
  const rnd = seeded(3), pick = (a) => a[Math.floor(rnd() * a.length)];
  const out = [];
  let x = 60;
  while (x < 360) { const w = pick([3, 3, 5, 7, 4]); out.push({ x, w }); x += w + pick([3, 4, 6]); }
  return out;
})();

/** Barcode scanner: bars with a scan line sweeping across. */
export const DemoBarcode = () => (
  <Frame>
    {BARS.map((b) => <rect key={b.x} x={b.x} y="28" width={b.w} height="94" fill="currentColor" />)}
    <rect className="dk-d-glow dk-a-fill" x="34" y="18" width="18" height="114" fillOpacity=".2" />
    <rect className="dk-d-scan dk-a-fill" x="52" y="18" width="3" height="114" />
  </Frame>
);

const HIST = [34, 58, 84, 104, 92, 70, 48, 30, 18];

/** Exploratory data analysis: a histogram breathing, scatter points blinking. */
export const DemoData = () => (
  <Frame>
    <path d="M40,132 H392" stroke="currentColor" strokeOpacity=".25" />
    {HIST.map((h, k) => (
      <rect key={k} className="dk-d-hb" style={{ animationDelay: `${(k * 0.15).toFixed(2)}s` }} x={62 + k * 34} y={132 - h} width="24" height={h} rx="3" fill="currentColor" fillOpacity=".85" />
    ))}
    {Array.from({ length: 8 }, (_, k) => (
      <circle key={k} className="dk-d-sd dk-a-fill" style={{ animationDelay: `${(k * 0.3).toFixed(1)}s` }} cx={70 + k * 41} cy={26 + ((k * 37) % 30)} r="3.5" />
    ))}
  </Frame>
);

export const PROJECT_DEMOS = [DemoRag, DemoCandles, DemoPerson, DemoSignal, DemoBarcode, DemoData];

