---
"react-native-grab": patch
---

Keep the grab controls out of the selection owner's shadow subtree, so elements can be grabbed again on iOS. The controls moved inside the owner view when they started rendering in the resolved owner's window, and on iOS they are hosted by `FullWindowOverlay` - a full-screen native node that takes no `pointerEvents` prop. `findNodeAtPoint` walks the owner's subtree and skips a node only when its `pointerEvents` makes it untargetable, so that overlay swallowed every hit test and resolved each grab to the owner itself. The controls are now a sibling of the registered view, which keeps them in the owner's window without shadowing its content.
