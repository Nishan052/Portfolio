import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import NotFound from "./NotFound";

// react-router-dom v7 only ships an "exports" map, which CRA's Jest 27 cannot resolve (see __tests__/test-utils.js)
jest.mock("react-router-dom", () => ({ Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a> }), { virtual: true });

describe("NotFound", () => {
  test("says nothing is here and links to the home page", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /home page/i })).toHaveAttribute("href", "/");
  });
});
