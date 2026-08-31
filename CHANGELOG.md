# react-native-grab

## 1.1.2

### Patch Changes

- 5722d55: Fix selection landing below the finger on Android. Fabric measures in the coordinate space of the surface root, while touches report page coordinates in the coordinate space of the native window, and Android's main surface starts a status bar below its window. The gap is now read off the touch that starts the gesture instead of assumed to be zero, so it stays correct for natively presented surfaces (which have their own window) and on iOS (where the two spaces already coincide).
- 2a10576: Resolve grab points against the selection owner instead of the window, so elements are selected under the finger when the owner is not at the window origin (a screen under a native header, or a natively presented surface).

  Let `ReactNativeGrabSurface` be sized by its host: it no longer forces a fill, and takes `flex: 1` through `style` when it should fill a presented container. Surface activation now deactivates on unmount, a failed owner registration is reported instead of failing silently, and the web entry points render their children rather than dropping the subtree.

- 2a10576: Add `ReactNativeGrabSurface` for selecting React Native content hosted in separately presented native surfaces.
- 502b064: Render the grab controls in the window of the owner that currently resolves selection, so they stay visible above natively presented surfaces. Previously the controls were always rendered by `ReactNativeGrabRoot`, which left them stranded behind sheets on Android: a sheet is presented in its own window, and no `zIndex` inside the main window can paint over it. The control bar is also placed against the measured size of its container rather than the window's, since that container is a sheet rather than the whole screen whenever a surface owns selection.

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
