/**
 * Open a URL the way a click on a link would, without navigating this page: a new tab for web links,
 * the default mail app for mailto:. Used where the open has to happen from code, after an effect.
 */
export default function openLink(url) {
  const a = document.createElement("a");
  a.href = url;
  if (!/^mailto:/i.test(url)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
  document.body.appendChild(a);
  a.click();
  a.remove();
}
