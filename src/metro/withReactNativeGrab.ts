import { execFileSync } from "node:child_process";
import type { IncomingMessage, ServerResponse } from "node:http";

import { createMetroConfigTransformer } from "metro-config-transformers";

const MAX_BODY_BYTES = 1024 * 512;
const JSON_HEADERS = { "Content-Type": "application/json" };
const COPY_ROUTE = "/__react-native-grab/copy";

type JsonObject = Record<string, unknown>;
type NextFn = () => void;
type Middleware = (req: IncomingMessage, res: ServerResponse, next: NextFn) => void;

const tryCopy = (command: string, args: string[], text: string): boolean => {
  try {
    execFileSync(command, args, { input: text });
    return true;
  } catch {
    return false;
  }
};

const copyToHostClipboard = (text: string): boolean => {
  if (process.platform === "darwin") {
    return tryCopy("pbcopy", [], text);
  }

  if (process.platform === "win32") {
    return tryCopy("clip", [], text);
  }

  return (
    tryCopy("xclip", ["-selection", "clipboard"], text) ||
    tryCopy("xsel", ["--clipboard", "--input"], text)
  );
};

const sendJson = (res: ServerResponse, statusCode: number, payload: JsonObject) => {
  res.writeHead(statusCode, JSON_HEADERS);
  res.end(JSON.stringify(payload));
};

const getPathname = (req: IncomingMessage): string => {
  if (typeof req.url !== "string") return "";
  try {
    return new URL(req.url, "http://localhost").pathname;
  } catch {
    return req.url.split("?")[0];
  }
};

const parseJsonObject = (value: string): JsonObject | null => {
  if (!value) return {};

  const parsed: unknown = JSON.parse(value);
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  return parsed as JsonObject;
};

const readJsonBody = (
  req: IncomingMessage,
  res: ServerResponse,
  onSuccess: (payload: JsonObject) => void,
): void => {
  let body = "";
  let byteLength = 0;
  let resolved = false;

  req.on("data", (chunk: Buffer | string) => {
    if (resolved) return;
    const asString = chunk.toString();
    byteLength += Buffer.byteLength(asString);

    if (byteLength > MAX_BODY_BYTES) {
      resolved = true;
      sendJson(res, 413, { ok: false, error: "Payload too large" });
      req.destroy();
      return;
    }

    body += asString;
  });

  req.on("end", () => {
    if (resolved) return;

    try {
      const payload = parseJsonObject(body);
      if (payload === null) {
        sendJson(res, 400, { ok: false, error: "Invalid JSON payload shape" });
        return;
      }

      resolved = true;
      onSuccess(payload);
    } catch {
      resolved = true;
      sendJson(res, 400, { ok: false, error: "Invalid JSON" });
    }
  });
};

const handleCopyRequest = (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  readJsonBody(req, res, (payload) => {
    const text = typeof payload.text === "string" ? payload.text : "";

    if (!text.trim()) {
      sendJson(res, 400, { ok: false, error: "Missing text" });
      return;
    }

    const copied = copyToHostClipboard(text);
    if (!copied) {
      sendJson(res, 500, { ok: false, error: "Clipboard write failed on host" });
      return;
    }

    sendJson(res, 200, { ok: true });
  });
};

const handleReactNativeGrabRequest = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFn,
): void => {
  const pathname = getPathname(req);

  if (pathname === COPY_ROUTE) {
    handleCopyRequest(req, res);
    return;
  }

  next();
};

type MetroLikeConfig = {
  server?: {
    enhanceMiddleware?: (middleware: Middleware, metroServer: unknown) => Middleware;
  };
};

export const withReactNativeGrab = createMetroConfigTransformer(
  (config: MetroLikeConfig): MetroLikeConfig => {
    const previousEnhanceMiddleware = config.server?.enhanceMiddleware;

    return {
      ...config,
      server: {
        ...config.server,
        enhanceMiddleware: (middleware, metroServer) => {
          const baseMiddleware = previousEnhanceMiddleware
            ? previousEnhanceMiddleware(middleware, metroServer)
            : middleware;

          return (req, res, next) => {
            handleReactNativeGrabRequest(req, res, () => {
              baseMiddleware(req, res, next);
            });
          };
        },
      },
    };
  },
);
