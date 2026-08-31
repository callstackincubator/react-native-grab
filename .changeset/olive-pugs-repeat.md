---
"react-native-grab": patch
---

Resolve grab points against the selection owner instead of the window, so elements are selected under the finger when the owner is not at the window origin (a screen under a native header, or a natively presented surface).

Let `ReactNativeGrabSurface` be sized by its host: it no longer forces a fill, and takes `flex: 1` through `style` when it should fill a presented container. Surface activation now deactivates on unmount, a failed owner registration is reported instead of failing silently, and the web entry points render their children rather than dropping the subtree.
