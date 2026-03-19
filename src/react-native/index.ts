import type { ReactNativeGrabRootProps } from "./grab-root";
import type { ReactNativeGrabScreenProps } from "./grab-screen";
import type { ReactNativeGrabContextProviderProps } from "./grab-context";
import type { ReactNode } from "react";

export type { ReactNativeGrabRootProps } from "./grab-root";
export type { ReactNativeGrabScreenProps } from "./grab-screen";
export type {
  ReactNativeGrabContextProviderProps,
  ReactNativeGrabContextValue,
} from "./grab-context";

const noop = () => {};
const Passthrough = ({ children }: { children?: ReactNode }) => children;

export const ReactNativeGrabRoot: React.ComponentType<ReactNativeGrabRootProps> = __DEV__
  ? require("./grab-root").ReactNativeGrabRoot
  : Passthrough;

export const ReactNativeGrabScreen: React.ComponentType<ReactNativeGrabScreenProps> = __DEV__
  ? require("./grab-screen").ReactNativeGrabScreen
  : Passthrough;

export const ReactNativeGrabContextProvider: React.ComponentType<ReactNativeGrabContextProviderProps> =
  __DEV__ ? require("./grab-context").ReactNativeGrabContextProvider : Passthrough;

export const enableGrabbing: () => void = __DEV__
  ? require("./grab-controller").enableGrabbing
  : noop;

export const setFocusEffect: (impl: (cb: () => void) => void) => void = __DEV__
  ? require("./focus-effect").setFocusEffect
  : noop;
