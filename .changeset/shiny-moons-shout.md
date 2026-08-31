---
"react-native-grab": patch
---

Render the grab controls in the window of the owner that currently resolves selection, so they stay visible above natively presented surfaces. Previously the controls were always rendered by `ReactNativeGrabRoot`, which left them stranded behind sheets on Android: a sheet is presented in its own window, and no `zIndex` inside the main window can paint over it. The control bar is also placed against the measured size of its container rather than the window's, since that container is a sheet rather than the whole screen whenever a surface owns selection.
