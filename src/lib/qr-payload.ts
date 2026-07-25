/**
 * QR Payload structure for secure booking QR codes.
 * Contains only non-sensitive identifiers and security tokens.
 */
export interface QrPayload {
  ref: string; // Booking reference (e.g., "BK-2026-A1B2C3D4")
  ts: number; // Timestamp when QR was generated (milliseconds)
  token: string; // Secure token from backend (HMAC-signed)
}

/**
 * Generates a QR payload object for encoding into QR code.
 * The payload is stringified and encoded as the QR value.
 *
 * @param bookingRef - Booking reference from API
 * @param qrToken - QR token from API (backend-generated HMAC)
 * @param issuedAt - Optional timestamp override (defaults to now)
 * @returns Stringified QR payload ready for QRCodeSVG
 */
export const generateQrPayload = (
  bookingRef: string,
  qrToken: string,
  issuedAt?: number,
): string => {
  const payload: QrPayload = {
    ref: bookingRef,
    ts: issuedAt || Date.now(),
    token: qrToken,
  };

  return JSON.stringify(payload);
};

/**
 * Parses a QR payload string back into an object.
 * Used when scanning QR codes on partner side.
 *
 * @param qrString - Stringified QR payload
 * @returns Parsed QR payload object
 */
export const parseQrPayload = (qrString: string): QrPayload => {
  return JSON.parse(qrString);
};
