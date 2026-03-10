type EnableGrabbingHandler = () => void;
type ToggleGrabMenuHandler = () => void;

let enableGrabbingHandler: EnableGrabbingHandler | null = null;
let toggleGrabMenuHandler: ToggleGrabMenuHandler | null = null;

export const setEnableGrabbingHandler = (handler: EnableGrabbingHandler | null) => {
  enableGrabbingHandler = handler;
};

export const setToggleGrabMenuHandler = (handler: ToggleGrabMenuHandler | null) => {
  toggleGrabMenuHandler = handler;
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

export const toggleGrabMenu = () => {
  if (!toggleGrabMenuHandler) {
    console.error("[react-native-grab] Cannot toggle menu. Ensure ReactNativeGrabRoot is mounted.");
    return;
  }

  toggleGrabMenuHandler();
};
