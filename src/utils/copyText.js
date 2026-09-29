/** Copy text to the clipboard. Resolves true on success, false when the browser refuses or has no API. */
export default async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) { /* fall through */ }
  return false;
}
