import getDevServer from "react-native/Libraries/Core/Devtools/getDevServer";

const DEFAULT_COPY_ENDPOINT = "/__react-native-grab/copy";

type CopyRequestPayload = {
  text: string;
};

type CopyResponsePayload = {
  ok?: boolean;
  error?: string;
};

type CopyViaMetroOptions = {
  endpoint?: string;
  signal?: AbortSignal;
};

const hasProtocol = (url: string): boolean => /^https?:\/\//i.test(url);

const resolveEndpointUrl = (endpoint?: string): string => {
  const resolvedEndpoint = endpoint ?? DEFAULT_COPY_ENDPOINT;

  if (hasProtocol(resolvedEndpoint)) {
    return resolvedEndpoint;
  }

  const baseUrl = getDevServer().url;
  const normalizedEndpoint = resolvedEndpoint.startsWith("/")
    ? resolvedEndpoint.slice(1)
    : resolvedEndpoint;

  return `${baseUrl}${normalizedEndpoint}`;
};

export const copyViaMetro = async (
  text: string,
  options: CopyViaMetroOptions = {},
): Promise<void> => {
  if (!text.trim()) {
    throw new Error("Text to copy cannot be empty");
  }

  const response = await fetch(resolveEndpointUrl(options.endpoint), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text } satisfies CopyRequestPayload),
    signal: options.signal,
  });

  let payload: CopyResponsePayload | undefined;
  try {
    payload = (await response.json()) as CopyResponsePayload;
  } catch {
    payload = undefined;
  }

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error ?? `Copy request failed with status ${response.status}`);
  }
};
