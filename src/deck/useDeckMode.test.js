import { renderHook, act } from "@testing-library/react";
import useDeckMode from "./useDeckMode";
import siteConfig from "../config/site";

const setWidth = (w) => { Object.defineProperty(window, "innerWidth", { value: w, configurable: true, writable: true }); };

describe("useDeckMode", () => {
  const original = window.innerWidth;
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => { jest.useRealTimers(); setWidth(original); });

  test("is simple under the configured breakpoint and full above it", () => {
    setWidth(siteConfig.deck.simpleMax - 1);
    expect(renderHook(() => useDeckMode()).result.current).toBe(true);
    setWidth(siteConfig.deck.simpleMax);
    expect(renderHook(() => useDeckMode()).result.current).toBe(false);
  });

  test("switches when a resize crosses the breakpoint, after the resize settles", () => {
    setWidth(1400);
    const { result } = renderHook(() => useDeckMode());
    expect(result.current).toBe(false);
    setWidth(800);
    act(() => { window.dispatchEvent(new Event("resize")); });
    expect(result.current).toBe(false);          // debounced: not yet
    act(() => { jest.advanceTimersByTime(300); });
    expect(result.current).toBe(true);
  });

  test("ignores the transient 0-width viewport browsers report while switching sizes", () => {
    setWidth(1400);
    const { result } = renderHook(() => useDeckMode());
    setWidth(0);
    act(() => { window.dispatchEvent(new Event("resize")); jest.advanceTimersByTime(300); });
    expect(result.current).toBe(false);          // did not flip to plain mode for a moment that never was
  });
});
