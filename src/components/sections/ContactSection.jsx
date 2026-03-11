import { memo } from "react";
import { useTranslation } from "react-i18next";
import { LuMapPin } from "react-icons/lu";
import siteConfig from "../../config/site";
import "./ContactSection.css";

const CONTACTS = [
  {
    labelKey: "email",
    value: siteConfig.contact.email,
    href:  `mailto:${siteConfig.contact.email}`,
    external: false,
    icon: (
      <svg aria-hidden="true" focusable="false" width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    labelKey: "phone",
    value: siteConfig.contact.phone,
    href:  siteConfig.contact.phoneHref,
    external: false,
    icon: (
      <svg aria-hidden="true" focusable="false" width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.4 2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17Z" />
      </svg>
    ),
  },
  {
    labelKey: "github",
    value: siteConfig.contact.github,
    href:  siteConfig.contact.githubUrl,
    external: true,
    icon: (
      <svg aria-hidden="true" focusable="false" width="17" height="17" viewBox="0 0 24 24" fill="var(--accent)">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
      </svg>
    ),
  },
  {
    labelKey: "linkedin",
    value: siteConfig.contact.linkedin,
    href:  siteConfig.contact.linkedinUrl,
    external: true,
    icon: (
      <svg aria-hidden="true" focusable="false" width="17" height="17" viewBox="0 0 24 24" fill="var(--accent)">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    labelKey: "location",
    value: siteConfig.profile.location,
    href:  null,
    external: false,
    icon:  <LuMapPin size={17} color="var(--accent)" aria-hidden="true" />,
  },
];

/**
 * Single contact row — renders as <a> if href is set, <div> otherwise.
 */
const ContactRow = ({ item, labels, externalLabel }) => {
  const isExternal = item.external || (item.href && item.href.startsWith("http"));
  const inner = (
    <>
      <div className="contact-icon" aria-hidden="true">{item.icon}</div>
      <div className="contact-row-content">
        <div className="contact-row-label">{labels[item.labelKey]}</div>
        <div className="contact-row-value">{item.value}</div>
      </div>
      {item.href && (
        <span aria-hidden="true" className="contact-arrow">→</span>
      )}
    </>
  );

  return item.href ? (
    <a
      href={item.href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
      aria-label={isExternal ? `${labels[item.labelKey]}: ${item.value} (${externalLabel})` : undefined}
      className="contact-link"
    >
      {inner}
    </a>
  ) : (
    <div className="contact-link" style={{ cursor: "default" }}>
      {inner}
    </div>
  );
};

/**
 * Contact section — centred layout with a stacked list of contact methods.
 */
const ContactSection = memo(() => {
  const { t } = useTranslation();

  const title  = t("contact.title",  { returnObjects: true });
  const labels = t("contact.labels", { returnObjects: true });
  const externalLabel = t("a11y.externalLink");

  return (
  <section id="contact" aria-labelledby="contact-heading" className="section">
    <div className="section-overlay" aria-hidden="true" />
    <div className="container">
      <div className="divider" aria-hidden="true" />

      <div className="contact-center">
        <p className="section-tag fade-up" style={{ textAlign: "center" }}>{t("contact.tag")}</p>
        <h2 id="contact-heading" className="section-title fade-up fade-up-delay-1" style={{ textAlign: "center" }}>
          {title[0]}<br />{title[1]}
        </h2>
        <p className="contact-description fade-up fade-up-delay-2">
          {t("contact.description")}
        </p>

        <div className="contact-list fade-up fade-up-delay-3">
          {CONTACTS.map((item) => (
            <ContactRow key={item.labelKey} item={item} labels={labels} externalLabel={externalLabel} />
          ))}
        </div>
      </div>
    </div>
  </section>
  );
});

export default ContactSection;
