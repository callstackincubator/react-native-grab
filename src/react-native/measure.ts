import { BoundingClientRect, ReactNativeFiberNode, ReactNativeShadowNode } from "./types";

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
