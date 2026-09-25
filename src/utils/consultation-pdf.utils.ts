import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

const PDF_WIDTH = 612;
const PDF_HEIGHT = 792;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function requireCacheDirectory(): string {
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error("App storage is not available.");
  }
  return cacheDir;
}

async function writePdfToCache(html: string, destUri: string): Promise<void> {
  const options = {
    html: html.trim(),
    width: PDF_WIDTH,
    height: PDF_HEIGHT,
    base64: true,
  };

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      if (attempt > 0) {
        await sleep(250 * attempt);
      }

      const result = await Print.printToFileAsync(options);

      if (result.base64) {
        await FileSystem.writeAsStringAsync(destUri, result.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return;
      }

      if (result.uri) {
        await FileSystem.copyAsync({ from: result.uri, to: destUri });
        return;
      }

      lastError = new Error("PDF file was not created");
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Unable to render PDF");
}

function isShareDismissed(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("cancel") ||
    message.includes("dismiss") ||
    message.includes("user did not")
  );
}

/**
 * Renders consultation HTML to PDF and opens the system share sheet (WhatsApp, Drive, etc.).
 * Android `expo-sharing` requires a readable `file://` URL under the app cache (not content://).
 */
export async function generateAndShareConsultationPdf(
  html: string,
  fileBaseName: string,
): Promise<void> {
  const cacheDir = requireCacheDirectory();
  const safeName = fileBaseName.replace(/[^\w.-]+/g, "_").slice(0, 48);
  const destUri = `${cacheDir}${safeName}-${Date.now()}.pdf`;

  await writePdfToCache(html, destUri);

  const info = await FileSystem.getInfoAsync(destUri);
  if (!info.exists || ("size" in info && info.size === 0)) {
    throw new Error("PDF file is empty or missing.");
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Sharing is not available on this device.");
  }

  try {
    // Must stay a file:// URI under cacheDir — SharingModule rejects content:// and other paths.
    await Sharing.shareAsync(destUri, {
      mimeType: "application/pdf",
      dialogTitle: "Share consultation PDF",
      UTI: "com.adobe.pdf",
    });
  } catch (error) {
    if (isShareDismissed(error)) return;
    throw error;
  }
}

export async function generateConsultationPdfUri(html: string): Promise<string> {
  const cacheDir = requireCacheDirectory();
  const destUri = `${cacheDir}consultation-${Date.now()}.pdf`;
  await writePdfToCache(html, destUri);
  return destUri;
}
