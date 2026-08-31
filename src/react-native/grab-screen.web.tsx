import { View, type ViewProps } from "react-native";

// React Native Grab doesn't support web yet, so the screen only preserves layout.
// `id` identifies a selection owner, not a DOM node, so it is not forwarded.
export const ReactNativeGrabScreen = ({ id, style, ...props }: ViewProps & { id?: string }) => {
  return <View {...props} style={[{ flex: 1 }, style]} />;
};
