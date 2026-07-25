import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.smartpark.app",
  appName: "Smart Park",
  webDir: "dist",
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FFC700",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#FFC700",
    },
    Keyboard: {
      resize: "native",
      style: "LIGHT",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
