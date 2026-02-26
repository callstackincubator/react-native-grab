type EnableGrabbingHandler = () => void;

let enableGrabbingHandler: EnableGrabbingHandler | null = null;

export const setEnableGrabbingHandler = (handler: EnableGrabbingHandler | null) => {
  enableGrabbingHandler = handler;
};

export const enableGrabbing = () => {
  if (!enableGrabbingHandler) {
    console.error(
      "[react-native-grab] Cannot enable grabbing. Ensure ReactNativeGrabRoot is mounted.",
    );
    return;
  }

  enableGrabbingHandler();
};
