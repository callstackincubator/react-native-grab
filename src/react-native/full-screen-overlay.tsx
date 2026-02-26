import { ReactNode, Fragment } from "react";
import { Platform } from "react-native";

const getRoot = () => {
  if (Platform.OS !== "ios") {
    return Fragment;
  }

  try {
    return require("react-native-screens").FullWindowOverlay;
  } catch {
    // Nothing we can do about it, it's not installed in the project.
  }

  return Fragment;
};

const Root = getRoot();

export type FullScreenOverlayProps = {
  children: ReactNode;
};

export const FullScreenOverlay = ({ children }: FullScreenOverlayProps) => {
  return <Root>{children}</Root>;
};
