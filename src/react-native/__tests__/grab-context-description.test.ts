import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDescription,
  getGrabSelectionTitle,
  GRAB_HOST_LIKE_COMPONENT_NAMES,
  isHostLikeComponentName,
} from "../description";
import { composeGrabContextValue, ReactNativeGrabInternalContext } from "../grab-context";
import type { RenderedByFrame } from "../get-rendered-by";
import type { ReactNativeFiberNode } from "../types";

vi.mock("../get-rendered-by", () => ({
  getRenderedBy: vi.fn(async () => []),
}));

import { getRenderedBy } from "../get-rendered-by";

const mockedGetRenderedBy = vi.mocked(getRenderedBy);

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

const frame = (name: string): RenderedByFrame => ({
  name,
  file: null,
  line: null,
  column: null,
  collapse: false,
});

describe("isHostLikeComponentName", () => {
  it("treats View and Text as host-like", () => {
    for (const name of GRAB_HOST_LIKE_COMPONENT_NAMES) {
      expect(isHostLikeComponentName(name)).toBe(true);
    }
    expect(isHostLikeComponentName("InstallTabs")).toBe(false);
  });

  it("trims names before matching", () => {
    expect(isHostLikeComponentName("  Text  ")).toBe(true);
  });
});

describe("getGrabSelectionTitle", () => {
  it("skips host-like owners to show Text (in InstallTabs)", () => {
    const fiber = createHostFiber({ children: "x" });
    expect(getGrabSelectionTitle(fiber, [frame("Text"), frame("InstallTabs")])).toBe(
      "Text (in InstallTabs)",
    );
  });

  it("skips multiple host-like owners", () => {
    const viewFiber: ReactNativeFiberNode = {
      type: "View",
      memoizedProps: {},
      return: null,
      stateNode: null,
      _debugStack: new Error(),
      _debugOwner: null,
    };
    expect(getGrabSelectionTitle(viewFiber, [frame("View"), frame("Text"), frame("Screen")])).toBe(
      "View (in Screen)",
    );
  });

  it("returns host only when every owner is host-like", () => {
    const viewFiber: ReactNativeFiberNode = {
      type: "View",
      memoizedProps: {},
      return: null,
      stateNode: null,
      _debugStack: new Error(),
      _debugOwner: null,
    };
    expect(getGrabSelectionTitle(viewFiber, [frame("View"), frame("Text")])).toBe("View");
  });

  it("returns Selected element when host is unknown", () => {
    const fiber = {
      type: () => null,
      memoizedProps: {},
      return: null,
      stateNode: null,
      _debugStack: new Error(),
      _debugOwner: null,
    } as ReactNativeFiberNode;
    expect(getGrabSelectionTitle(fiber, [])).toBe("Selected element");
  });

  it("uses host-like name from renderedBy when the fiber has no string host", () => {
    const fiber = {
      type: () => null,
      memoizedProps: {},
      return: null,
      stateNode: null,
      _debugStack: new Error(),
      _debugOwner: null,
    } as ReactNativeFiberNode;
    expect(getGrabSelectionTitle(fiber, [frame("Text"), frame("InstallTabs")])).toBe(
      "Text (in InstallTabs)",
    );
  });
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
  beforeEach(() => {
    mockedGetRenderedBy.mockReset();
    mockedGetRenderedBy.mockResolvedValue([]);
  });

  it("keeps current output format when no context provider is in ancestors", async () => {
    const selectedFiber = createHostFiber({ children: "Hello" });

    const description = await getDescription(selectedFiber);

    expect(description).toContain("<Text>");
    expect(description).toContain("Hello");
    expect(description).not.toContain("Context:");
  });

  it("uses first non-host-like renderedBy name for the preview tag", async () => {
    mockedGetRenderedBy.mockResolvedValue([frame("Text"), frame("InstallTabs")]);
    const selectedFiber = createHostFiber({ children: "Hello" });

    const description = await getDescription(selectedFiber);

    expect(description.startsWith("<InstallTabs")).toBe(true);
    expect(description).toContain("Hello");
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
