import { describe, expect, it, vi } from "vitest";
import { getDescription } from "../description";
import { composeGrabContextValue, ReactNativeGrabInternalContext } from "../grab-context";
import type { ReactNativeFiberNode } from "../types";

vi.mock("../get-rendered-by", () => ({
  getRenderedBy: vi.fn(async () => []),
}));

const createHostFiber = (
  props: Record<string, unknown>,
  parent: ReactNativeFiberNode | null = null,
): ReactNativeFiberNode => ({
  type: "Text",
  memoizedProps: props,
  return: parent,
  stateNode: null,
  _debugStack: new Error(),
  _debugOwner: null,
});

const createContextProviderFiber = (
  value: Record<string, string | number | boolean | null>,
  parent: ReactNativeFiberNode | null = null,
): ReactNativeFiberNode => ({
  type: ReactNativeGrabInternalContext.Provider,
  memoizedProps: { value },
  return: parent,
  stateNode: null,
  _debugStack: new Error(),
  _debugOwner: null,
});

describe("composeGrabContextValue", () => {
  it("returns shallow copy when parent context does not exist", () => {
    const result = composeGrabContextValue(null, { screen: "home", attempt: 1 });

    expect(result).toEqual({ screen: "home", attempt: 1 });
  });

  it("merges parent and child with child override precedence", () => {
    const result = composeGrabContextValue(
      { screen: "home", theme: "light", source: "parent" },
      { source: "child", variant: "hero" },
    );

    expect(result).toEqual({
      screen: "home",
      theme: "light",
      source: "child",
      variant: "hero",
    });
  });
});

describe("getDescription with grab context", () => {
  it("keeps current output format when no context provider is in ancestors", async () => {
    const selectedFiber = createHostFiber({ children: "Hello" });

    const description = await getDescription(selectedFiber);

    expect(description).toContain("<Text>");
    expect(description).toContain("Hello");
    expect(description).not.toContain("Context:");
  });

  it("appends Context block from nearest provider value", async () => {
    const parentProvider = createContextProviderFiber({ screen: "home", locale: "en" });
    const childProvider = createContextProviderFiber(
      { locale: "pl", section: "cta" },
      parentProvider,
    );
    const selectedFiber = createHostFiber({ children: "Tap me" }, childProvider);

    const description = await getDescription(selectedFiber);

    expect(description).toContain("<Text>");
    expect(description).toContain("Tap me");
    expect(description).toContain("Context:");
    expect(description).toContain('"locale": "pl"');
    expect(description).toContain('"section": "cta"');
    expect(description).not.toContain('"screen": "home"');
  });
});
