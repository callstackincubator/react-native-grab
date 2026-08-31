import { View, type ViewProps } from "react-native";

// React Native Grab doesn't support web yet, so the surface only preserves layout.
export const ReactNativeGrabSurface = ({ active, ...props }: ViewProps & { active: boolean }) => {
  return <View {...props} />;
};
