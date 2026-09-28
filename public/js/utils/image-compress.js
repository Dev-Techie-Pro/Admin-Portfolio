const PRESET_DEFAULTS = {
  avatar: { maxWidth: 192, maxHeight: 192, quality: 0.82, maxBytes: 12e4 },
  icon: { maxWidth: 256, maxHeight: 256, quality: 0.85, maxBytes: 16e4 },
  thumbnail: { maxWidth: 512, maxHeight: 512, quality: 0.82, maxBytes: 22e4 },
  cover: { maxWidth: 1200, maxHeight: 400, quality: 0.8, maxBytes: 38e4 },
  hero: { maxWidth: 1600, maxHeight: 900, quality: 0.82, maxBytes: 65e4 },
  gallery: { maxWidth: 1920, maxHeight: 1080, quality: 0.82, maxBytes: 9e5 },
  general: { maxWidth: 1920, maxHeight: 1920, quality: 0.82, maxBytes: 95e4 }
};
const MIN_QUALITY = 0.48;
const SKIP_REENCODE_TYPES = /* @__PURE__ */ new Set(["image/gif", "image/svg+xml"]);
let webpEncodeSupported = null;
function supportsWebPEncode() {
  if (webpEncodeSupported !== null) return webpEncodeSupported;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;
    webpEncodeSupported = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    webpEncodeSupported = false;
  }
  return webpEncodeSupported;
}
function resolveImageCompressOptions(options = {}) {
  const preset = options.preset || "general";
  const base = PRESET_DEFAULTS[preset] || PRESET_DEFAULTS.general;
  return {
    maxWidth: options.maxWidth ?? base.maxWidth,
    maxHeight: options.maxHeight ?? base.maxHeight,
    quality: options.quality ?? base.quality,
    maxBytes: options.maxBytes ?? base.maxBytes
  };
}
function compressPresetForUploadFolder(folder) {
  switch (String(folder || "general").toLowerCase()) {
    case "avatars":
      return "avatar";
    case "icons":
      return "icon";
    case "testimonials":
      return "thumbnail";
    case "blog":
      return "hero";
    case "projects":
      return "gallery";
    case "contact":
      return "general";
    default:
      return "general";
  }
}
function scaleToFit(width, height, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale
  };
}
function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}
function drawToCanvas(source, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Could not process image.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}
function canvasHasMeaningfulAlpha(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;
  const { width, height } = canvas;
  if (width * height > 4e6) {
    const sample = document.createElement("canvas");
    sample.width = Math.min(48, width);
    sample.height = Math.min(48, height);
    const sctx = sample.getContext("2d");
    if (!sctx) return true;
    sctx.drawImage(canvas, 0, 0, sample.width, sample.height);
    const data2 = sctx.getImageData(0, 0, sample.width, sample.height).data;
    for (let i = 3; i < data2.length; i += 4) {
      if (data2[i] < 250) return true;
    }
    return false;
  }
  const data = ctx.getImageData(0, 0, width, height).data;
  const step = Math.max(4, Math.floor(data.length / 4 / 8e3) * 4);
  for (let i = 3; i < data.length; i += step) {
    if (data[i] < 250) return true;
  }
  return false;
}
function pickOutputMime(file, canvas, scaled) {
  if (file.type === "image/png" && !scaled && !canvasHasMeaningfulAlpha(canvas)) {
    return supportsWebPEncode() ? "image/webp" : "image/jpeg";
  }
  if (file.type === "image/png" && canvasHasMeaningfulAlpha(canvas)) {
    return supportsWebPEncode() ? "image/webp" : "image/png";
  }
  if (file.type === "image/webp") return "image/webp";
  return supportsWebPEncode() ? "image/webp" : "image/jpeg";
}
async function loadImageElement(file) {
  const objectUrl = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not read image."));
    img.src = objectUrl;
  });
  return {
    img,
    cleanup: () => URL.revokeObjectURL(objectUrl)
  };
}
async function encodeUnderBudget(sourceCanvas, mimeType, startQuality, maxBytes) {
  let quality = startQuality;
  let blob = await canvasToBlob(sourceCanvas, mimeType, quality);
  if (!blob) throw new Error("Could not process image.");
  if (blob.size <= maxBytes) return blob;
  let low = MIN_QUALITY;
  let high = quality;
  while (high - low > 0.04) {
    const mid = (low + high) / 2;
    const trial = await canvasToBlob(sourceCanvas, mimeType, mid);
    if (!trial) break;
    if (trial.size <= maxBytes) {
      blob = trial;
      low = mid;
    } else {
      high = mid;
    }
  }
  if (blob.size <= maxBytes) return blob;
  let canvas = sourceCanvas;
  let w = canvas.width;
  let h = canvas.height;
  while (blob.size > maxBytes && w > 80 && h > 80) {
    w = Math.max(80, Math.round(w * 0.85));
    h = Math.max(80, Math.round(h * 0.85));
    canvas = drawToCanvas(canvas, w, h);
    const trial = await canvasToBlob(canvas, mimeType, low);
    if (!trial) break;
    blob = trial;
  }
  return blob;
}
async function compressImageFile(file, options = {}) {
  const type = (file.type || "").toLowerCase();
  if (SKIP_REENCODE_TYPES.has(type)) {
    return { blob: file, mimeType: type || "application/octet-stream" };
  }
  const { maxWidth, maxHeight, quality, maxBytes } = resolveImageCompressOptions(options);
  let source;
  let cleanup = null;
  let srcWidth = 0;
  let srcHeight = 0;
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      source = bitmap;
      srcWidth = bitmap.width;
      srcHeight = bitmap.height;
      cleanup = () => bitmap.close();
    } catch {
    }
  }
  if (!srcWidth) {
    const { img, cleanup: revoke } = await loadImageElement(file);
    source = img;
    srcWidth = img.naturalWidth;
    srcHeight = img.naturalHeight;
    cleanup = revoke;
  }
  const { width, height, scale } = scaleToFit(srcWidth, srcHeight, maxWidth, maxHeight);
  const scaled = scale < 1;
  if (!scaled && file.size <= maxBytes && (type === "image/webp" || file.size < 9e4)) {
    cleanup?.();
    return { blob: file, mimeType: type || "image/jpeg" };
  }
  const canvas = drawToCanvas(source, width, height);
  cleanup?.();
  const outputType = pickOutputMime(file, canvas, scaled);
  const blob = await encodeUnderBudget(canvas, outputType, quality, maxBytes);
  return { blob, mimeType: outputType };
}
function extensionForMime(mimeType) {
  switch (mimeType) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/svg+xml":
      return ".svg";
    default:
      return ".jpg";
  }
}
export {
  compressImageFile,
  compressPresetForUploadFolder,
  extensionForMime,
  resolveImageCompressOptions
};
