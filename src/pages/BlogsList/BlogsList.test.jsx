import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import BlogsList from "./BlogsList";

// react-router-dom v7 only ships an "exports" map, which CRA's Jest 27 cannot resolve (see __tests__/test-utils.js)
jest.mock("react-router-dom", () => ({ Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a> }), { virtual: true });
// the real post index uses webpack's require.context, which Jest does not have
let mockPosts = [];
jest.mock("../../data/blogs/index", () => ({ __esModule: true, get default() { return mockPosts; } }));

const post = (slug, category) => ({ slug, category, title: `Post ${slug}`, excerpt: "x", tags: [], date: "2026-01-01", readTime: 3, icon: "Brain" });

function renderWith(posts) {
  mockPosts = posts;
  return render(<BlogsList />);
}
const filterNames = () => within(screen.getByRole("group", { name: /filter/i })).getAllByRole("button").map((b) => b.textContent);

describe("BlogsList category filters", () => {
  test("no 'AI News' filter while there are no news posts", () => {
    renderWith([post("a", "project"), post("b", "research")]);
    expect(filterNames()).toEqual(["All", "Projects", "Research"]);
  });

  test("the 'AI News' filter appears by itself once a news post exists", () => {
    renderWith([post("a", "project"), post("n", "news")]);
    expect(filterNames()).toEqual(["All", "Projects", "AI News"]);
  });

  test("a single category gives 'All' plus that category", () => {
    renderWith([post("a", "research")]);
    expect(filterNames()).toEqual(["All", "Research"]);
  });
});
