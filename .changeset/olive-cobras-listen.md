---
"react-native-grab": patch
---

Remove deep imports from `react-native`. `getDevServer` and `symbolicateStackTrace` are now implemented locally on top of the public `NativeModules` export and Metro's `symbolicate` endpoint, so the deprecation warnings are gone and the library keeps working under the Strict API that React Native 0.87 enables by default.
