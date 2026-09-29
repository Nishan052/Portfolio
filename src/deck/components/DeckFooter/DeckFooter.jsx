import { Link } from "react-router-dom";
import siteConfig from "../../../config/site";
import "./DeckFooter.css";

const { contact, footer } = siteConfig;

/**
 * Closing lines of the Contact scene: a row of links (profiles, email, blog) and the copyright line.
 *
 * @param {Function} props.t  i18next t
 */
export default function DeckFooter({ t }) {
  return (
    <footer className="dk-footer" data-in>
      <nav className="dk-footer-links dk-mono" aria-label={t("deck.footer.nav")}>
        <a href={contact.githubUrl} target="_blank" rel="noopener noreferrer">{t("hero.github")} <span aria-hidden="true">↗</span></a>
        <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer">{t("contact.labels.linkedin")} <span aria-hidden="true">↗</span></a>
        <a href={`mailto:${contact.email}`}>{t("deck.footer.email")}</a>
        <Link to="/blogs">{t("deck.footer.blog")}</Link>
      </nav>
      <p className="dk-foot dk-mono">{t("deck.contact.foot", { year: footer.copyrightYear })}</p>
    </footer>
  );
}
