import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const devServer = {
  url: "http://localhost:8081/",
  fullBundleUrl: "http://localhost:8081/index.bundle",
  bundleLoadedFromServer: true,
};

vi.mock("../dev-server", () => ({
  getDevServer: () => devServer,
}));

import { symbolicateStackTrace } from "../symbolicate";

const frame = {
  methodName: "Counter",
  file: "http://localhost:8081/index.bundle",
  lineNumber: 12,
  column: 3,
};

beforeEach(() => {
  devServer.bundleLoadedFromServer = true;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("symbolicateStackTrace", () => {
  it("posts the stack to Metro and returns the symbolicated result", async () => {
    const symbolicated = { stack: [{ ...frame, file: "src/Counter.tsx" }], codeFrame: null };
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => symbolicated,
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(symbolicateStackTrace([frame], { extra: true })).resolves.toEqual(symbolicated);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://localhost:8081/symbolicate");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      stack: [frame],
      extraData: { extra: true },
    });
  });

  it("throws when the bundle was not loaded from Metro", async () => {
    devServer.bundleLoadedFromServer = false;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(symbolicateStackTrace([frame])).rejects.toThrow(
      "Bundle was not loaded from Metro",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when Metro responds with an error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })),
    );

    await expect(symbolicateStackTrace([frame])).rejects.toThrow(
      "Symbolicate request failed with status 500",
    );
  });
});
