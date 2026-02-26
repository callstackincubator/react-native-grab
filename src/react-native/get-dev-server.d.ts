declare module "react-native/Libraries/Core/Devtools/getDevServer" {
  type DevServerInfo = {
    url: string;
    fullBundleUrl: string | null;
    bundleLoadedFromServer: boolean;
  };

  export default function getDevServer(): DevServerInfo;
}
