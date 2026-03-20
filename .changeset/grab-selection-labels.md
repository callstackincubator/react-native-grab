---
"react-native-grab": patch
---

Grab labels now prefer meaningful component names from the owner stack (skipping generic `View` / `Text` wrappers), so the menu shows titles like **Text (in YourScreen)** and the copied description preview matches. The selection menu title also scales down when the label is long so it stays readable.
