![React Native Grab](https://github.com/callstackincubator/react-native-grab/raw/main/docs/banner.jpg)

### Touch-to-grab context tool for React Native UI changes

[![mit licence][license-badge]][license]
[![npm downloads][npm-downloads-badge]][npm-downloads]
[![Chat][chat-badge]][chat]
[![PRs Welcome][prs-welcome-badge]][prs-welcome]

Bridge the context gap: point at the exact native UI element, capture precise source context, and hand it to your coding agent without guesswork.

> **Inspired by** [React Grab](https://github.com/aidenybai/react-grab) — this project brings the same touch-to-grab workflow to React Native.

## Requirements

**This library supports only the [New Architecture](https://reactnative.dev/docs/the-new-architecture/landing-page) with the [Fabric](https://reactnative.dev/architecture/fabric-renderer) renderer.** It relies on Fabric’s native view hierarchy and APIs and will not work with the legacy architecture or Paper renderer. Ensure your app has the New Architecture (and Fabric) enabled before using React Native Grab.

## Features

- **Point, Don't Describe**: Select the exact element on screen instead of describing layouts in prompts.
- **Native Runtime Context**: Capture context directly from real React Native views with platform-aware source signals.
- **Faster Agent Edits**: Remove the search phase for low-entropy UI changes like spacing, alignment, and copy updates.
- **Metro Middleware Integration**: Wire once in Metro and send captured context to your host clipboard.

## Installation

```bash
npm install react-native-grab
```

## Quick Start

1. Add React Native Grab middleware to Metro.
2. Wrap your app root with `ReactNativeGrabRoot`.
3. **If your app uses native navigators** (e.g. native stack, native tabs), **wrap each screen** with `ReactNativeGrabScreen`.
4. Open Dev Menu and choose `React Native Grab` to start selecting elements.

## Quick Configuration Example

```javascript
// metro.config.js
const { getDefaultConfig } = require("@react-native/metro-config");
const { withReactNativeGrab } = require("react-native-grab/metro");

const config = getDefaultConfig(__dirname);
module.exports = withReactNativeGrab(config);

// app root
import {
  ReactNativeGrabRoot,
  ReactNativeGrabScreen,
  ReactNativeGrabContextProvider,
} from "react-native-grab";

// When using native navigators (native stack, native tabs), wrap each screen:
function HomeScreen() {
  return (
    <ReactNativeGrabScreen>
      <ReactNativeGrabContextProvider value={{ screen: "home" }}>
        {/* screen content */}
      </ReactNativeGrabContextProvider>
    </ReactNativeGrabScreen>
  );
}

export default function AppLayout() {
  return <ReactNativeGrabRoot>{/* app/navigation tree */}</ReactNativeGrabRoot>;
}
```

## API

- `ReactNativeGrabRoot`: Root-level provider for grab functionality.
- `ReactNativeGrabScreen`: When using native navigators (native stack, native tabs), wrap **each screen** with this component for accurate selection.
- `ReactNativeGrabContextProvider`: Adds custom metadata to grabbed elements. Nested providers are shallow-merged and child keys override parent keys. This provider is a no-op in production builds.
- `enableGrabbing()`: Programmatically enables grabbing flow.

When grab context is available for a selected element, copied output includes an additional `Context:` JSON block appended after the existing element preview and stack trace lines.

## Documentation

Documentation lives in this repository: [callstackincubator/react-native-grab](https://github.com/callstackincubator/react-native-grab). You can also use the following links to jump to specific topics:

- [Installation](https://github.com/callstackincubator/react-native-grab#installation)
- [Quick Start](https://github.com/callstackincubator/react-native-grab#quick-start)
- [API](https://github.com/callstackincubator/react-native-grab#api)

## Troubleshooting

### Missing React Native Grab in Dev Menu

If you use Expo and provide your own Dev Menu entries, you are most likely overwriting the changes added by React Native Grab.

In that case, import `enableGrabbing` and call it yourself whenever you want to start grabbing.

```ts
import { enableGrabbing } from "react-native-grab";
```

## Made with ❤️ at Callstack

`react-native-grab` is open source and free to use. If it helps your workflow, please star it 🌟. [Callstack][callstack-readme-with-love] is a team of React and React Native engineers, contact us at [hello@callstack.com](mailto:hello@callstack.com) if you need help or just want to say hi.

Like the project? ⚛️ [Join the team](https://callstack.com/careers/?utm_campaign=Senior_RN&utm_source=github&utm_medium=readme) who does amazing stuff for clients and drives React Native Open Source! 🔥

[callstack-readme-with-love]: https://callstack.com/?utm_source=github.com&utm_medium=referral&utm_campaign=react-native-grab&utm_term=readme-with-love
[license-badge]: https://img.shields.io/npm/l/react-native-grab?style=for-the-badge
[license]: https://github.com/callstackincubator/react-native-grab/blob/main/LICENSE
[npm-downloads-badge]: https://img.shields.io/npm/dm/react-native-grab?style=for-the-badge
[npm-downloads]: https://www.npmjs.com/package/react-native-grab
[prs-welcome-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge
[prs-welcome]: https://github.com/callstackincubator/react-native-grab/pulls
[chat-badge]: https://img.shields.io/discord/426714625279524876.svg?style=for-the-badge
[chat]: https://discord.gg/xgGt7KAjxv
