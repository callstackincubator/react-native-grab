# react-native-grab

## 1.1.0

### Minor Changes

- New control bar for grab overlay with improved actions and layout.

### Patch Changes

- Grab screen now works without a navigation library by falling back to `useEffect` when focus APIs are unavailable.

## 1.0.0

### Minor Changes

- Add support for custom grab context metadata via `ReactNativeGrabContextProvider` and include captured context in copied element descriptions.

### Patch Changes

- Fix missing component stack information when grabbing the same element repeatedly.
