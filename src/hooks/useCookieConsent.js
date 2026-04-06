import { useState } from "react";

const KEY = "cookieConsent";

export default function useCookieConsent() {
  const [consent, setConsent] = useState(() => localStorage.getItem(KEY));

  const accept = () => {
    localStorage.setItem(KEY, "accepted");
    setConsent("accepted");
  };

  const decline = () => {
    localStorage.setItem(KEY, "declined");
    setConsent("declined");
  };

  return { consent, accept, decline };
}
