# react-native-grab

## 1.1.1

### Patch Changes

- ba7c5d4: Fix misaligned grab highlights by mounting the overlay per screen, so grab lines up correctly with native tab layouts (e.g. bottom tabs).
- d029f4b: Grab labels now prefer meaningful component names from the owner stack (skipping generic `View` / `Text` wrappers), so the menu shows titles like **Text (in YourScreen)** and the copied description preview matches. The selection menu title also scales down when the label is long so it stays readable.

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
