export type ScanStats = {
  blob: Blob;
  blur: number;
  bright: number;
  glare: number;
};

/** Re-encode to JPEG so EXIF (including location) is dropped. Longest side is 1600px. */
export async function prepImage(file: Blob): Promise<ScanStats> {
  const bmp = await createImageBitmap(file);
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height, 1));
  const width = Math.max(1, Math.round(bmp.width * scale));
  const height = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    bmp.close?.();
    throw new Error("canvas");
  }
  ctx.drawImage(bmp, 0, 0, width, height);
  bmp.close?.();
  const sampleW = Math.min(96, width);
  const sampleH = Math.min(96, height);
  const sample = document.createElement("canvas");
  sample.width = sampleW;
  sample.height = sampleH;
  const sctx = sample.getContext("2d", { willReadFrequently: true });
  if (!sctx) throw new Error("canvas");
  sctx.drawImage(canvas, 0, 0, sampleW, sampleH);
  const pixels = sctx.getImageData(0, 0, sampleW, sampleH).data;
  const gray: number[] = [];
  let glare = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const y = 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
    gray.push(y);
    if (y > 245) glare += 1;
  }
  const bright = gray.reduce((sum, n) => sum + n, 0) / Math.max(gray.length, 1);
  let lap = 0;
  const w = sampleW;
  for (let y = 1; y < sampleH - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = y * w + x;
      const v = gray[i - w] + gray[i + w] + gray[i - 1] + gray[i + 1] - 4 * gray[i];
      lap += v * v;
    }
  }
  const blur = lap / Math.max(gray.length, 1);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((out) => (out ? resolve(out) : reject(new Error("jpeg"))), "image/jpeg", 0.8);
  });
  return { blob, blur, bright, glare: glare / Math.max(gray.length, 1) };
}

export function qualityHint(stats: ScanStats, kind: "doc" | "selfie"): "blur" | "dark" | "bright" | "glare" | null {
  if (stats.blur < (kind === "selfie" ? 8 : 14)) return "blur";
  if (stats.bright < 42) return "dark";
  if (stats.bright > 232) return "bright";
  if (kind === "doc" && stats.glare > 0.16) return "glare";
  return null;
}

/** null means the browser has no face detector. A head covering can still pass. */
export async function faceVisible(blob: Blob): Promise<boolean | null> {
  const Detector = (window as unknown as { FaceDetector?: new (opts?: { fastMode?: boolean; maxDetectedFaces?: number }) => { detect: (src: ImageBitmap) => Promise<unknown[]> } }).FaceDetector;
  if (!Detector) return null;
  try {
    const bmp = await createImageBitmap(blob);
    const faces = await new Detector({ fastMode: true, maxDetectedFaces: 1 }).detect(bmp);
    bmp.close?.();
    return faces.length > 0;
  } catch {
    return null;
  }
}
