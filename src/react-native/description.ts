import { ReactNativeFiberNode } from "./types";
import { getRenderedBy } from "./get-rendered-by";
import type { RenderedByFrame } from "./get-rendered-by";
import type { ReactNativeGrabContextValue } from "./grab-context";
import { ReactNativeGrabInternalContext } from "./grab-context";

const MAX_STACK_LINES = 6;
const MAX_TEXT_LENGTH = 120;
const MAX_ATTR_VALUE_LENGTH = 80;
const MAX_ATTRS = 6;

const PRIORITY_ATTRS = [
  "testID",
  "nativeID",
  "accessibilityLabel",
  "accessibilityRole",
  "accessibilityHint",
  "accessibilityValue",
] as const;

const truncate = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
};

const escapeAttr = (value: string): string => {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n|\r/g, " ")
    .replace(/"/g, '\\"');
};

const stringifyAttrValue = (value: unknown): string | null => {
  if (value == null) return null;
  if (typeof value === "string") {
    if (value.trim().length === 0) return null;
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return null;
};

const collectPrimitiveText = (value: unknown, out: string[]) => {
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    if (text.length > 0) out.push(text);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectPrimitiveText(item, out);
    }
  }
};

const extractTextPreview = (props: Record<string, unknown> | null): string => {
  if (!props || !("children" in props)) return "";

  const parts: string[] = [];
  collectPrimitiveText(props.children, parts);
  if (parts.length === 0) return "";

  const normalized = parts.join(" ").replace(/\s+/g, " ").trim();
  return truncate(normalized, MAX_TEXT_LENGTH);
};

const getHostFiber = (node: ReactNativeFiberNode): ReactNativeFiberNode | null => {
  let current: ReactNativeFiberNode | null = node;

  while (current) {
    if (typeof current.type === "string") {
      return current;
    }
    current = current.return ?? null;
  }

  return (node as unknown as ReactNativeFiberNode) ?? null;
};

const getHostComponentName = (fiber: ReactNativeFiberNode | null): string => {
  const componentType = fiber?.type;
  if (typeof componentType === "string" && componentType.length > 0) {
    return componentType;
  }
  return "(unknown)";
};

const getMemoizedProps = (fiber: ReactNativeFiberNode | null): Record<string, unknown> | null => {
  const props = fiber?.memoizedProps;
  if (!props || typeof props !== "object") return null;
  return props;
};

const extractPriorityAttrs = (props: Record<string, unknown> | null): string => {
  if (!props) return "";

  const pairs: string[] = [];
  for (const key of PRIORITY_ATTRS) {
    if (pairs.length >= MAX_ATTRS) break;
    const rawValue = stringifyAttrValue(props[key]);
    if (!rawValue) continue;
    const value = escapeAttr(truncate(rawValue, MAX_ATTR_VALUE_LENGTH));
    pairs.push(`${key}="${value}"`);
  }

  return pairs.length > 0 ? ` ${pairs.join(" ")}` : "";
};

const getPreviewComponentName = (
  node: ReactNativeFiberNode,
  renderedBy: RenderedByFrame[],
): string => {
  const firstRenderedBy = renderedBy[0]?.name?.trim();
  if (firstRenderedBy) return firstRenderedBy;

  const hostFiber = getHostFiber(node);
  return getHostComponentName(hostFiber);
};

const buildElementPreview = (node: ReactNativeFiberNode, renderedBy: RenderedByFrame[]): string => {
  const componentName = getPreviewComponentName(node, renderedBy);
  const hostFiber = getHostFiber(node);
  const props = getMemoizedProps(hostFiber);
  const attrs = extractPriorityAttrs(props);
  const text = extractTextPreview(props);

  if (!text) {
    return `<${componentName}${attrs} />`;
  }

  return `<${componentName}${attrs}>\n  ${text}\n</${componentName}>`;
};

const formatFrameLocation = (
  file: string | null,
  line: number | null,
  column: number | null,
): string | null => {
  if (!file) return null;
  if (line == null) return file;
  if (column == null) return `${file}:${line}`;
  return `${file}:${line}:${column}`;
};

const buildStackContext = (renderedBy: RenderedByFrame[]): string => {
  const lines = renderedBy
    .filter((frame) => Boolean(frame.file))
    .slice(0, MAX_STACK_LINES)
    .map((frame) => {
      const location = formatFrameLocation(frame.file, frame.line, frame.column);
      if (!location) return "";
      return `\n  in ${frame.name} (at ${location})`;
    })
    .filter(Boolean);

  return lines.join("");
};

type ReactProviderType = {
  Provider?: unknown;
};

type ContextProviderFiberNode = ReactNativeFiberNode & {
  type?: unknown;
  memoizedProps?: {
    value?: ReactNativeGrabContextValue;
  } | null;
};

const isGrabContextProviderFiber = (fiber: ContextProviderFiberNode): boolean => {
  const providerType = fiber.type;
  return (
    providerType === ReactNativeGrabInternalContext ||
    providerType === (ReactNativeGrabInternalContext as ReactProviderType).Provider
  );
};

const getGrabContextFromFiber = (
  node: ReactNativeFiberNode,
): ReactNativeGrabContextValue | null => {
  let current: ContextProviderFiberNode | null = node;

  while (current) {
    if (isGrabContextProviderFiber(current)) {
      return current.memoizedProps?.value ?? null;
    }
    current = current.return ?? null;
  }

  return null;
};

const buildContextBlock = (contextValue: ReactNativeGrabContextValue | null): string => {
  if (!contextValue || Object.keys(contextValue).length === 0) {
    return "";
  }

  return `\n\nContext:\n${JSON.stringify(contextValue, null, 2)}`;
};

export const getDescription = async (node: ReactNativeFiberNode): Promise<string> => {
  let renderedBy = await getRenderedBy(node);

  const preview = buildElementPreview(node, renderedBy);
  const stackContext = buildStackContext(renderedBy);
  const contextBlock = buildContextBlock(getGrabContextFromFiber(node));

  if (!stackContext) return `${preview}${contextBlock}`;
  return `${preview}${stackContext}${contextBlock}`;
};
