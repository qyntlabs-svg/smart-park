# ML Kit barcode scanning (`@capacitor-mlkit/barcode-scanning`)

The partner **Scan QR** flow (`/partner/scan`) uses ML Kit on device and **BarcodeDetector + optional html5-qrcode** on web.

## App code

- Shared helper: `src/shared/lib/mlkit-barcode-scanner.ts`
- UI: `src/pages/PartnerScanScreen.tsx`
- Transparent WebView while scanning: `body.scanner-active` / `html.scanner-active` in `src/index.css`
- Web polyfill (better browser support): `import "barcode-detector/polyfill"` in `src/main.tsx`

## Install & sync

```bash
cd smart-park-main
npm install
npx cap sync
```

## Android

After `npx cap add android` (if you have no `android/` folder yet), edit **`android/app/src/main/AndroidManifest.xml`**:

**Before** `<application>`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

**Inside** `<application>`:

```xml
<meta-data
  android:name="com.google.mlkit.vision.DEPENDENCIES"
  android:value="barcode_ui" />
```

Rebuild the app in Android Studio or:

```bash
npx cap run android
```

## iOS

In **`ios/App/Podfile`**, set:

```ruby
platform :ios, '15.5'
```

In **`ios/App/App/Info.plist`**:

```xml
<key>NSCameraUsageDescription</key>
<string>Scan parking and booking QR codes at your facility.</string>
```

Then:

```bash
cd ios/App && pod install
```

## Web dev

1. Use HTTPS or `localhost` (camera APIs require a secure context).
2. Allow camera when prompted.
3. If ML Kit web is unavailable, the app falls back to **html5-qrcode** in the scan container.

## Removed legacy package

Do not use `@capacitor/barcode-scanner` — it has been removed from `package.json` in favor of ML Kit.
