---
"react-native-grab": patch
---

Fix selection landing below the finger on Android. Fabric measures in the coordinate space of the surface root, while touches report page coordinates in the coordinate space of the native window, and Android's main surface starts a status bar below its window. The gap is now read off the touch that starts the gesture instead of assumed to be zero, so it stays correct for natively presented surfaces (which have their own window) and on iOS (where the two spaces already coincide).
