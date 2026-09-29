/* Toolkit icon tiles (viewBox 96). Animations: demos.css (dk-i-*). */
const Ico = ({ children }) => <svg viewBox="0 0 96 96" aria-hidden="true">{children}</svg>;

export const TOOL_ICONS = [
  () => (
    <Ico>
      <rect x="20" y="12" width="44" height="64" rx="5" />
      <path className="dk-i-ln" d="M30,30H54M30,42H54M30,54H46" />
      <g className="dk-i-mag"><circle cx="62" cy="60" r="14" /><path d="M72,70L84,82" /></g>
    </Ico>
  ),
  () => (
    <Ico>
      <path d="M14,20H82V64H46L30,78V64H14Z" />
      <circle className="dk-i-dt" cx="36" cy="42" r="3.5" />
      <circle className="dk-i-dt" style={{ animationDelay: ".15s" }} cx="48" cy="42" r="3.5" />
      <circle className="dk-i-dt" style={{ animationDelay: ".3s" }} cx="60" cy="42" r="3.5" />
    </Ico>
  ),
  () => (
    <Ico>
      <rect x="28" y="28" width="40" height="40" rx="6" />
      <rect className="dk-i-core" x="40" y="40" width="16" height="16" rx="2" />
      <path className="dk-i-pin" d="M38,28V16M48,28V16M58,28V16M38,68V80M48,68V80M58,68V80M28,38H16M28,48H16M28,58H16M68,38H80M68,48H80M68,58H80" />
    </Ico>
  ),
  () => (
    <Ico>
      <path d="M16,14V80H84" strokeOpacity=".4" />
      <path className="dk-i-line" pathLength="1" d="M22,64L38,50L50,58L66,34L80,22" />
      <circle className="dk-i-tip" cx="80" cy="22" r="5" />
    </Ico>
  ),
  () => (
    <Ico>
      <g className="dk-i-rot"><path d="M74,36A28,28 0 0 0 26,32" /><path d="M26,60A28,28 0 0 0 70,66" /><path d="M26,20V33H39M70,76V63H57" /></g>
    </Ico>
  ),
  () => (
    <Ico>
      <path className="dk-i-net" d="M48,22L22,66H74Z M48,22V48 M22,66L48,48 M74,66L48,48" strokeDasharray="4 6" />
      <circle className="dk-i-nd" cx="48" cy="22" r="6" />
      <circle className="dk-i-nd" style={{ animationDelay: ".3s" }} cx="22" cy="66" r="6" />
      <circle className="dk-i-nd" style={{ animationDelay: ".6s" }} cx="74" cy="66" r="6" />
    </Ico>
  ),
];
