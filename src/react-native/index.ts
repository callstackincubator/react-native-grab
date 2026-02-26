import type { ReactNativeGrabRootProps } from "./grab-root";
import type { ReactNativeGrabScreenProps } from "./grab-screen";
import type { ReactNode } from "react";

export type { ReactNativeGrabRootProps } from "./grab-root";
export type { ReactNativeGrabScreenProps } from "./grab-screen";

const noop = () => {};
const Passthrough = ({ children }: { children?: ReactNode }) => children;

export const ReactNativeGrabRoot: React.ComponentType<ReactNativeGrabRootProps> = __DEV__
  ? require("./grab-root").ReactNativeGrabRoot
  : Passthrough;

export const ReactNativeGrabScreen: React.ComponentType<ReactNativeGrabScreenProps> = __DEV__
  ? require("./grab-screen").ReactNativeGrabScreen
  : Passthrough;

export const enableGrabbing: () => void = __DEV__
  ? require("./grab-controller").enableGrabbing
  : noop;
