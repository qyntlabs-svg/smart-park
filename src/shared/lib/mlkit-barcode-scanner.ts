/**
 * Unified barcode scanning via @capacitor-mlkit/barcode-scanning.
 * - Native (Android/iOS): camera preview behind the WebView; use scanner-active CSS.
 * - Web: requires a <video> for ML Kit web impl, or falls back to html5-qrcode.
 */
import { Capacitor } from "@capacitor/core";
import {
  BarcodeFormat,
  BarcodeScanner,
  LensFacing,
  type PluginListenerHandle,
} from "@capacitor-mlkit/barcode-scanning";
import { Html5Qrcode } from "html5-qrcode";

export const SCANNER_UI_CLASS = "scanner-active";

export function setScannerUiActive(active: boolean) {
  document.body.classList.toggle(SCANNER_UI_CLASS, active);
  document.documentElement.classList.toggle(SCANNER_UI_CLASS, active);
}

export async function requestBarcodeCameraPermission(): Promise<boolean> {
  const { camera } = await BarcodeScanner.checkPermissions();
  if (camera === "granted" || camera === "limited") return true;
  const { camera: requested } = await BarcodeScanner.requestPermissions();
  return requested === "granted" || requested === "limited";
}

export async function isMlkitBarcodeScanAvailable(): Promise<boolean> {
  try {
    const { supported } = await BarcodeScanner.isSupported();
    return supported;
  } catch {
    return false;
  }
}

export async function toggleBarcodeTorch(enabled: boolean): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return enabled;
  try {
    if (enabled) await BarcodeScanner.disableTorch();
    else await BarcodeScanner.enableTorch();
    return !enabled;
  } catch {
    return enabled;
  }
}

export type BarcodeScanSession = {
  stop: () => Promise<void>;
};

export type StartBarcodeScanOptions = {
  /** Required on web when BarcodeDetector is available (after polyfill). */
  videoElement?: HTMLVideoElement | null;
  /** Element id for html5-qrcode fallback (web only). */
  html5ElementId?: string;
  onDecoded: (value: string) => void | Promise<void>;
  formats?: BarcodeFormat[];
};

async function stopMlkitListener(listener: PluginListenerHandle | null) {
  try {
    if (listener) await listener.remove();
    await BarcodeScanner.removeAllListeners();
    await BarcodeScanner.stopScan();
  } catch {
    /* already stopped */
  }
}

/**
 * Starts continuous QR/barcode scanning. Call `session.stop()` when done.
 */
export async function startBarcodeScanSession(
  options: StartBarcodeScanOptions,
): Promise<BarcodeScanSession> {
  const granted = await requestBarcodeCameraPermission();
  if (!granted) {
    throw new Error("Camera permission denied");
  }

  setScannerUiActive(true);

  const formats = options.formats ?? [BarcodeFormat.QrCode];
  let listener: PluginListenerHandle | null = null;
  let html5: Html5Qrcode | null = null;
  let stopped = false;

  const handleValue = async (value: string) => {
    if (stopped || !value) return;
    stopped = true;
    await options.onDecoded(value);
  };

  const platform = Capacitor.getPlatform();

  if (platform === "web") {
    const mlkitWeb = await isMlkitBarcodeScanAvailable();
    if (mlkitWeb && options.videoElement) {
      listener = await BarcodeScanner.addListener(
        "barcodesScanned",
        async (event) => {
          const value =
            event.barcodes?.[0]?.rawValue ??
            event.barcodes?.[0]?.displayValue;
          if (value) await handleValue(value);
        },
      );
      await BarcodeScanner.startScan({
        videoElement: options.videoElement,
        lensFacing: LensFacing.Back,
        formats,
      });
    } else if (options.html5ElementId) {
      html5 = new Html5Qrcode(options.html5ElementId, {
        verbose: false,
      });
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras.length) {
        throw new Error("No camera found");
      }
      const back =
        cameras.find((c) => /back|rear|environment/i.test(c.label)) ??
        cameras[0];
      await html5.start(
        back.id,
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1,
        },
        (decoded) => {
          void handleValue(decoded);
        },
        () => {
          /* ignore frame errors */
        },
      );
    } else {
      setScannerUiActive(false);
      throw new Error(
        "Web scanning needs a video element or html5 scan container",
      );
    }
  } else {
    listener = await BarcodeScanner.addListener(
      "barcodesScanned",
      async (event) => {
        const value =
          event.barcodes?.[0]?.rawValue ?? event.barcodes?.[0]?.displayValue;
        if (value) await handleValue(value);
      },
    );
    await BarcodeScanner.startScan({ formats });
  }

  return {
    stop: async () => {
      stopped = true;
      await stopMlkitListener(listener);
      listener = null;
      if (html5) {
        try {
          await html5.stop();
          html5.clear();
        } catch {
          /* ignore */
        }
        html5 = null;
      }
      setScannerUiActive(false);
    },
  };
}

export async function cleanupBarcodeScanning() {
  setScannerUiActive(false);
  try {
    await BarcodeScanner.removeAllListeners();
    await BarcodeScanner.stopScan();
  } catch {
    /* ignore */
  }
}
