import { View, type ViewProps } from "react-native";

// React Native Grab doesn't support web yet, so the root only preserves layout.
export const ReactNativeGrabRoot = ({ style, ...props }: ViewProps) => {
  return <View {...props} style={[{ flex: 1 }, style]} />;
};
