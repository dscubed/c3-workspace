import QRCode from "qrcode";

/** Generates a PNG buffer from any payload string. Used server-side for email attachments. */
export async function generateQRCodeBuffer(payload: string): Promise<Buffer> {
  return QRCode.toBuffer(payload, { width: 300, margin: 2, type: "png" });
}

/** Generates a base64 data URL from any payload string. Used server-side for API responses. */
export async function generateQRCodeDataURL(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: 280,
    margin: 2,
    color: { dark: "#1a1a1a", light: "#ffffff" },
  });
}
