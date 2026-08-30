import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNativeElement } from "react-native";

vi.mock("react-native", () => ({
  findNodeHandle: (ref: { nativeTag: number }) => ref.nativeTag,
}));

vi.mock("../fabric", () => ({
  getFabricUIManager: () => ({
    findShadowNodeByTag_DEPRECATED: (nativeTag: number) => ({ nativeTag }),
  }),
}));

import {
  clearGrabSelectionOwnerFocus,
  getResolvedGrabSelectionOwnerId,
  registerGrabSelectionOwner,
  setGrabSelectionOwnerActive,
  setGrabSelectionOwnerFocused,
  unregisterGrabSelectionOwner,
} from "../containers";

const registeredOwnerIds: string[] = [];

const registerOwner = (id: string, kind: "root" | "screen" | "surface", nativeTag: number) => {
  registeredOwnerIds.push(id);
  registerGrabSelectionOwner(id, kind, { nativeTag } as unknown as ReactNativeElement);
};

afterEach(() => {
  for (const id of registeredOwnerIds.splice(0)) {
    unregisterGrabSelectionOwner(id);
  }
});

describe("grab selection owner resolution", () => {
  it("prefers the most recently activated surface and restores previous owners", () => {
    registerOwner("root", "root", 1);
    registerOwner("screen", "screen", 2);
    setGrabSelectionOwnerFocused("screen", true);
    registerOwner("first-sheet", "surface", 3);
    registerOwner("second-sheet", "surface", 4);
    expect(getResolvedGrabSelectionOwnerId()).toBe("screen");

    setGrabSelectionOwnerActive("first-sheet", true);
    expect(getResolvedGrabSelectionOwnerId()).toBe("first-sheet");

    setGrabSelectionOwnerActive("second-sheet", true);
    expect(getResolvedGrabSelectionOwnerId()).toBe("second-sheet");

    setGrabSelectionOwnerActive("second-sheet", false);
    expect(getResolvedGrabSelectionOwnerId()).toBe("first-sheet");

    setGrabSelectionOwnerActive("second-sheet", true);
    expect(getResolvedGrabSelectionOwnerId()).toBe("second-sheet");

    unregisterGrabSelectionOwner("second-sheet");
    expect(getResolvedGrabSelectionOwnerId()).toBe("first-sheet");

    setGrabSelectionOwnerActive("first-sheet", false);
    expect(getResolvedGrabSelectionOwnerId()).toBe("screen");

    clearGrabSelectionOwnerFocus("screen");
    expect(getResolvedGrabSelectionOwnerId()).toBe("root");
  });
});
