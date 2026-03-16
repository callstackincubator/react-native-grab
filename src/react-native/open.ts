import getDevServer from "react-native/Libraries/Core/Devtools/getDevServer";

type OpenFramePayload = {
  file: string;
  lineNumber: number;
};

export const openStackFrameInEditor = async (payload: OpenFramePayload): Promise<void> => {
  const response = await fetch(`${getDevServer().url}open-stack-frame`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Open stack frame request failed with status ${response.status}`);
  }
};
