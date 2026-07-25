import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./index.css";

// ML Kit web: Barcode Detection API polyfill (Chrome, Safari, Firefox dev)
if (Capacitor.getPlatform() === "web") {
  void import("barcode-detector/polyfill");
}

createRoot(document.getElementById("root")!).render(<App />);
