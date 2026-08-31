import { NativeModules } from "react-native";

export type DevServerInfo = {
  url: string;
  fullBundleUrl: string | null;
  bundleLoadedFromServer: boolean;
};

const FALLBACK_URL = "http://localhost:8081/";

type SourceCodeModule = {
  getConstants?: () => { scriptURL?: string | null };
  scriptURL?: string | null;
};

let cachedDevServerUrl: string | null | undefined;
let cachedFullBundleUrl: string | null;

/**
 * `scriptURL` is exposed through `getConstants()` on the New Architecture, but
 * older React Native versions only expose it as a plain constant on the module.
 */
const getScriptUrl = (): string | null => {
  const sourceCode = (NativeModules as { SourceCode?: SourceCodeModule }).SourceCode;
  if (!sourceCode) return null;

  try {
    return sourceCode.getConstants?.().scriptURL ?? sourceCode.scriptURL ?? null;
  } catch {
    return null;
  }
};

/**
 * Resolves the Metro dev server URL without deep-importing
 * `react-native/Libraries/Core/Devtools/getDevServer`, which is no longer part
 * of React Native's public API. `NativeModules` is a public root export, so
 * this keeps working across the Strict API cutover in 0.87.
 */
export const getDevServer = (): DevServerInfo => {
  if (cachedDevServerUrl === undefined) {
    const scriptUrl = getScriptUrl();
    const match = scriptUrl?.match(/^https?:\/\/.*?\//);
    cachedDevServerUrl = match ? match[0] : null;
    cachedFullBundleUrl = match ? (scriptUrl as string) : null;
  }

  return {
    url: cachedDevServerUrl ?? FALLBACK_URL,
    fullBundleUrl: cachedFullBundleUrl,
    bundleLoadedFromServer: cachedDevServerUrl !== null,
  };
};

export const resetDevServerCache = (): void => {
  cachedDevServerUrl = undefined;
  cachedFullBundleUrl = null;
};
