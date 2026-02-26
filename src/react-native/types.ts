export type ReactNativeShadowNode = unknown;
export type ReactNativeFiberNode = {
  type?: unknown;
  return?: ReactNativeFiberNode | null;
  memoizedProps?: Record<string, unknown> | null;
  stateNode: { node: ReactNativeShadowNode } | null;
  _debugStack: Error;
  _debugOwner: unknown;
};
export type BoundingClientRect = [number, number, number, number];
