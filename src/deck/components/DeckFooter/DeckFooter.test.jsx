import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import i18n from "../../../i18n/index.js";
import siteConfig from "../../../config/site";
import DeckFooter from "./DeckFooter";

jest.mock("react-router-dom", () => ({ Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a> }), { virtual: true });

const t = (...a) => i18n.t(...a);

describe("DeckFooter", () => {
  beforeEach(async () => { await i18n.changeLanguage("en"); });

  test("links to GitHub and LinkedIn (new tab), email and the blog", () => {
    render(<DeckFooter t={t} />);
    const links = screen.getByRole("navigation", { name: t("deck.footer.nav") });
    expect(links).toHaveTextContent("GitHub");
    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAttribute("href", siteConfig.contact.githubUrl);
    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute("href", siteConfig.contact.linkedinUrl);
    expect(screen.getByRole("link", { name: "Email" })).toHaveAttribute("href", `mailto:${siteConfig.contact.email}`);
    expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute("href", "/blogs");
  });

  test("the copyright line uses the configured year", () => {
    render(<DeckFooter t={t} />);
    expect(screen.getByText(new RegExp(`© ${siteConfig.footer.copyrightYear} Nishan Poojary`))).toBeInTheDocument();
  });
});
