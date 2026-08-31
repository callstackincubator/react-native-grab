import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NativeTouchEvent } from "react-native";

const findShadowNodeByTag_DEPRECATED = vi.fn();
const measureInWindow = vi.fn();

vi.mock("../fabric", () => ({
  getFabricUIManager: () => ({ findShadowNodeByTag_DEPRECATED }),
}));

import { getFabricWindowOffset } from "../measure";

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.nativeFabricUIManager = { measureInWindow } as never;
});

const touch = (values: Partial<NativeTouchEvent>) =>
  ({
    target: "1" as never,
    pageX: 0,
    pageY: 0,
    locationX: 0,
    locationY: 0,
    ...values,
  }) as NativeTouchEvent;

const targetAt = (x: number, y: number) => {
  findShadowNodeByTag_DEPRECATED.mockReturnValue({});
  measureInWindow.mockImplementation(
    (_node: unknown, callback: (x: number, y: number, w: number, h: number) => void) => {
      callback(x, y, 10, 10);
    },
  );
};

describe("getFabricWindowOffset", () => {
  it("is zero when the surface root sits at the window origin", () => {
    targetAt(20, 300);
    expect(
      getFabricWindowOffset(touch({ pageX: 25, pageY: 310, locationX: 5, locationY: 10 })),
    ).toEqual([0, 0]);
  });

  it("reports the gap when the surface root is offset inside its window", () => {
    // The target measures 48.8dp higher in Fabric space than the touch reports,
    // which is roughly how far Android's main surface starts below the window.
    targetAt(20, 251);
    expect(
      getFabricWindowOffset(touch({ pageX: 25, pageY: 310, locationX: 5, locationY: 10 })),
    ).toEqual([0, -49]);
  });

  it("falls back to no offset when the touch target cannot be resolved", () => {
    findShadowNodeByTag_DEPRECATED.mockReturnValue(null);
    expect(getFabricWindowOffset(touch({ pageX: 25, pageY: 310 }))).toEqual([0, 0]);

    findShadowNodeByTag_DEPRECATED.mockImplementation(() => {
      throw new Error("unknown tag");
    });
    expect(getFabricWindowOffset(touch({ pageX: 25, pageY: 310 }))).toEqual([0, 0]);

    expect(getFabricWindowOffset(touch({ target: "0" as never, pageX: 25, pageY: 310 }))).toEqual([
      0, 0,
    ]);
  });
});
