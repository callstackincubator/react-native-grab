import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sourceCode: {
  getConstants?: () => { scriptURL?: string | null };
  scriptURL?: string | null;
} = {};

vi.mock("react-native", () => ({
  NativeModules: {
    get SourceCode() {
      return sourceCode;
    },
  },
}));

import { getDevServer, resetDevServerCache } from "../dev-server";

const setScriptUrl = (scriptURL: string | null) => {
  sourceCode.getConstants = () => ({ scriptURL });
};

beforeEach(() => {
  resetDevServerCache();
  delete sourceCode.getConstants;
  delete sourceCode.scriptURL;
});

afterEach(() => {
  resetDevServerCache();
});

describe("getDevServer", () => {
  it("derives the dev server origin from the bundle scriptURL", () => {
    setScriptUrl("http://192.168.0.10:8081/index.bundle?platform=ios&dev=true");

    expect(getDevServer()).toEqual({
      url: "http://192.168.0.10:8081/",
      fullBundleUrl: "http://192.168.0.10:8081/index.bundle?platform=ios&dev=true",
      bundleLoadedFromServer: true,
    });
  });

  it("falls back to localhost when the bundle was not loaded from Metro", () => {
    setScriptUrl("file:///var/containers/Bundle/Application/main.jsbundle");

    expect(getDevServer()).toEqual({
      url: "http://localhost:8081/",
      fullBundleUrl: null,
      bundleLoadedFromServer: false,
    });
  });

  it("reads scriptURL as a plain constant when getConstants is unavailable", () => {
    sourceCode.scriptURL = "https://localhost:8082/index.bundle";

    expect(getDevServer().url).toBe("https://localhost:8082/");
  });

  it("falls back when the SourceCode module throws", () => {
    sourceCode.getConstants = () => {
      throw new Error("bridge unavailable");
    };

    expect(getDevServer().bundleLoadedFromServer).toBe(false);
  });

  it("caches the resolved URL across calls", () => {
    const getConstants = vi.fn(() => ({ scriptURL: "http://localhost:8081/index.bundle" }));
    sourceCode.getConstants = getConstants;

    getDevServer();
    getDevServer();

    expect(getConstants).toHaveBeenCalledTimes(1);
  });
});
