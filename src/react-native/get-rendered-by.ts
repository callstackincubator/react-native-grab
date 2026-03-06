import symbolicateStackTrace from "react-native/Libraries/Core/Devtools/symbolicateStackTrace";
import type { ReactNativeGrabStackFrame as StackFrame } from "react-native/Libraries/Core/Devtools/parseErrorStack";
import { ReactNativeFiberNode } from "./types";

export type RenderedByFrame = {
  name: string;
  file: string | null;
  line: number | null;
  column: number | null;
  collapse: boolean;
};

type V8CallSite = {
  getFunctionName(): string | null;
  getFileName(): string | null;
  getLineNumber(): number | null;
  getColumnNumber(): number | null;
};

const firstUserFrameFromError = (
  error: Error,
): { file: string | null; line: number | null; column: number | null } | null => {
  let callSites: V8CallSite[] | null = null;
  const prev = (Error as any).prepareStackTrace;
  (Error as any).prepareStackTrace = (_: unknown, sites: V8CallSite[]) => {
    callSites = sites;
    return "";
  };
  void error.stack;
  (Error as any).prepareStackTrace = prev;

  if (callSites && (callSites as V8CallSite[]).length > 0) {
    const sites = callSites as V8CallSite[];

    let start = 0;
    for (let i = 0; i < Math.min(sites.length, 3); i++) {
      const fn = sites[i].getFunctionName() ?? "";
      if (
        fn.includes("react-stack-top-frame") ||
        fn.includes("react_stack_bottom_frame") ||
        fn === ""
      ) {
        start = i + 1;
      } else {
        break;
      }
    }

    for (let i = start; i < sites.length; i++) {
      const fn = sites[i].getFunctionName() ?? "";
      if (fn.includes("react_stack_bottom_frame") || fn.includes("react-stack-bottom-frame")) {
        break;
      }
      const file = sites[i].getFileName();
      if (!file) continue;
      return {
        file,
        line: sites[i].getLineNumber(),
        column: sites[i].getColumnNumber(),
      };
    }
    return null;
  }

  const prevStr = (Error as any).prepareStackTrace;
  (Error as any).prepareStackTrace = undefined;
  let stack = error.stack ?? "";
  (Error as any).prepareStackTrace = prevStr;

  if (stack.startsWith("Error: react-stack-top-frame\n")) {
    stack = stack.slice("Error: react-stack-top-frame\n".length);
  }
  for (let i = 0; i < 2; i++) {
    const nl = stack.indexOf("\n");
    if (nl !== -1) stack = stack.slice(nl + 1);
  }
  const sentinelIdx = stack.search(/react[_-]stack[_-]bottom[_-]frame/);
  if (sentinelIdx !== -1) {
    const cut = stack.lastIndexOf("\n", sentinelIdx);
    if (cut !== -1) stack = stack.slice(0, cut);
  }

  const firstLine = stack.split("\n").find((l) => l.trim());
  if (!firstLine) return null;

  const v8 = firstLine.match(/at\s+(?:.+?\s+\()?(.+):(\d+):(\d+)\)?$/);
  if (v8) {
    return { file: v8[1], line: parseInt(v8[2], 10), column: parseInt(v8[3], 10) };
  }
  const gecko = firstLine.match(/@(.+):(\d+):(\d+)$/);
  if (gecko) {
    return { file: gecko[1], line: parseInt(gecko[2], 10), column: parseInt(gecko[3], 10) };
  }

  return null;
};

const getNameFromFiber = (fiber: any): string => {
  const type = fiber?.type;
  if (!type) return "(unknown)";
  if (typeof type === "function") {
    return type.displayName || type.name || "(anonymous)";
  }
  if (typeof type === "string") {
    return type;
  }
  if (type.render) {
    return type.displayName || type.render.displayName || type.render.name || "ForwardRef";
  }
  if (type.type) {
    const inner = type.type;
    return (
      type.displayName ||
      (typeof inner === "function" ? inner.displayName || inner.name : null) ||
      "Memo"
    );
  }
  return "(unknown)";
};

const getRenderedByFrames = (fiber: any): RenderedByFrame[] => {
  const result: RenderedByFrame[] = [];
  let current: any = fiber;

  while (current) {
    const owner = current._debugOwner;
    const debugStack: Error | string | null | undefined = current._debugStack;

    if (!owner) break;

    const name = getNameFromFiber(owner);

    if (!debugStack) {
      result.push({ name, file: null, line: null, column: null, collapse: false });
      current = owner;
      continue;
    }

    const loc =
      typeof debugStack === "string"
        ? (() => {
            const m = debugStack.match(/at\s+(?:.+?\s+\()?(.+):(\d+):(\d+)\)?/);
            return m ? { file: m[1], line: parseInt(m[2], 10), column: parseInt(m[3], 10) } : null;
          })()
        : firstUserFrameFromError(debugStack);

    result.push({
      name,
      file: loc?.file ?? null,
      line: loc?.line ?? null,
      column: loc?.column ?? null,
      collapse: false,
    });

    current = owner;
  }

  return result;
};

const toMetroStackFrame = (frame: RenderedByFrame): StackFrame => {
  return {
    methodName: frame.name,
    file: frame.file ?? undefined,
    lineNumber: frame.line ?? undefined,
    column: frame.column ?? undefined,
    collapse: frame.collapse,
  };
};

export const getRenderedBy = async (fiber: ReactNativeFiberNode): Promise<RenderedByFrame[]> => {
  const frames = getRenderedByFrames(fiber);
  if (frames.length === 0) return frames;

  try {
    const metroFrames = frames.map(toMetroStackFrame);
    const { stack: symbolicated } = await symbolicateStackTrace(metroFrames);
    return symbolicated
      .filter((sf) => sf.collapse !== true)
      .map((sf, i) => ({
        name: frames[i]?.name ?? sf.methodName,
        file: sf.file ?? null,
        line: sf.lineNumber ?? null,
        column: sf.column ?? null,
        collapse: sf.collapse === true,
      }));
  } catch {
    return frames;
  }
};
