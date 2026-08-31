import { getDevServer } from "./dev-server";

export type StackFrame = {
  methodName: string;
  file: string | null | undefined;
  lineNumber: number | null | undefined;
  column: number | null | undefined;
  collapse?: boolean;
};

export type CodeFrame = {
  content: string;
  location: { row: number; column: number } | null;
  fileName: string;
};

export type SymbolicatedStackTrace = {
  stack: StackFrame[];
  codeFrame: CodeFrame | null;
};

/**
 * Posts a stack to Metro's `symbolicate` endpoint, replacing the deep import of
 * `react-native/Libraries/Core/Devtools/symbolicateStackTrace`. That module has
 * no public replacement, but it is a thin wrapper over this request.
 */
export const symbolicateStackTrace = async (
  stack: StackFrame[],
  extraData?: unknown,
): Promise<SymbolicatedStackTrace> => {
  const devServer = getDevServer();
  if (!devServer.bundleLoadedFromServer) {
    throw new Error("Bundle was not loaded from Metro.");
  }

  const response = await fetch(`${devServer.url}symbolicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stack, extraData }),
  });

  if (!response.ok) {
    throw new Error(`Symbolicate request failed with status ${response.status}`);
  }

  return (await response.json()) as SymbolicatedStackTrace;
};
