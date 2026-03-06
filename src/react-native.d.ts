declare module "react-native/Libraries/Core/Devtools/parseErrorStack" {
  export type ReactNativeGrabStackFrame = {
    column: number | null | undefined;
    file: string | null | undefined;
    lineNumber: number | null | undefined;
    methodName: string;
    collapse: boolean;
  };
}
