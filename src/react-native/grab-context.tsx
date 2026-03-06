import { createContext, useContext } from "react";
import type { ReactNode } from "react";

export type ReactNativeGrabContextValue = Record<string, string | number | boolean | null>;

export type ReactNativeGrabContextProviderProps = {
  value: ReactNativeGrabContextValue;
  children?: ReactNode;
};

type InternalReactNativeGrabContextValue = ReactNativeGrabContextValue | null;

export const ReactNativeGrabInternalContext =
  createContext<InternalReactNativeGrabContextValue>(null);

export const composeGrabContextValue = (
  parentValue: InternalReactNativeGrabContextValue,
  value: ReactNativeGrabContextValue,
): ReactNativeGrabContextValue => {
  if (!parentValue) {
    return { ...value };
  }

  return { ...parentValue, ...value };
};

export const ReactNativeGrabContextProvider = ({
  value,
  children,
}: ReactNativeGrabContextProviderProps) => {
  const parentValue = useContext(ReactNativeGrabInternalContext);
  const composedValue = composeGrabContextValue(parentValue, value);

  return (
    <ReactNativeGrabInternalContext.Provider value={composedValue}>
      {children}
    </ReactNativeGrabInternalContext.Provider>
  );
};
