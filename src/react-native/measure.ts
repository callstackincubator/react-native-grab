import type { NativeTouchEvent } from "react-native";
import { BoundingClientRect, ReactNativeFiberNode, ReactNativeShadowNode } from "./types";
import { getFabricUIManager } from "./fabric";

export const measureInWindow = (node: ReactNativeShadowNode): BoundingClientRect => {
  let boundingClientRect: BoundingClientRect | null = null;

  nativeFabricUIManager.measureInWindow(node, (x, y, width, height) => {
    boundingClientRect = [x, y, width, height];
  });

  if (!boundingClientRect) {
    throw new Error("Failed to measure node");
  }

  return boundingClientRect;
};

export const findNodeAtPoint = (
  node: ReactNativeShadowNode,
  x: number,
  y: number,
): ReactNativeFiberNode | null => {
  let fiberNode: ReactNativeFiberNode | null = null;

  nativeFabricUIManager.findNodeAtPoint(node, x, y, (internalNode) => {
    fiberNode = internalNode;
  });

  return fiberNode;
};

const findShadowNodeByTag = (tag: NativeTouchEvent["target"]): ReactNativeShadowNode | null => {
  const nativeTag = typeof tag === "string" ? Number(tag) : tag;

  if (!nativeTag || Number.isNaN(nativeTag)) {
    return null;
  }

  try {
    return getFabricUIManager().findShadowNodeByTag_DEPRECATED(nativeTag) ?? null;
  } catch {
    return null;
  }
};

/**
 * Fabric measures in the coordinate space of the surface root, while touches
 * report `pageX`/`pageY` in the coordinate space of the native window hosting
 * that surface. The two only coincide when the surface root sits at the window
 * origin, which is why hit testing was accurate on iOS and a status bar too low
 * in Android's main window.
 *
 * A touch carries both spaces at once - `pageX`/`pageY` alongside `locationX`/
 * `locationY` relative to `target` - so the offset between them can be read off
 * the touch itself rather than guessed per platform. Read it once when the
 * gesture starts: the offset belongs to the window, not to the touched view, and
 * Android only guarantees that `location` matches `target` on the initial touch.
 */
export const getFabricWindowOffset = (nativeEvent: NativeTouchEvent): [number, number] => {
  const targetNode = findShadowNodeByTag(nativeEvent.target);

  if (!targetNode) {
    return [0, 0];
  }

  try {
    const targetRect = measureInWindow(targetNode);
    return [
      targetRect[0] + nativeEvent.locationX - nativeEvent.pageX,
      targetRect[1] + nativeEvent.locationY - nativeEvent.pageY,
    ];
  } catch {
    return [0, 0];
  }
};
