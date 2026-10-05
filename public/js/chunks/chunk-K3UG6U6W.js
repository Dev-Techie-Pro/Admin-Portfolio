import {
  showToast
} from "./chunk-B2QR3Q5R.js";

// client/utils/image-compress.ts
var PRESET_DEFAULTS = {
  avatar: { maxWidth: 192, maxHeight: 192, quality: 0.82, maxBytes: 12e4 },
  icon: { maxWidth: 256, maxHeight: 256, quality: 0.85, maxBytes: 16e4 },
  thumbnail: { maxWidth: 512, maxHeight: 512, quality: 0.82, maxBytes: 22e4 },
  cover: { maxWidth: 1200, maxHeight: 400, quality: 0.8, maxBytes: 38e4 },
  hero: { maxWidth: 1600, maxHeight: 900, quality: 0.82, maxBytes: 65e4 },
  gallery: { maxWidth: 1920, maxHeight: 1080, quality: 0.82, maxBytes: 9e5 },
  general: { maxWidth: 1920, maxHeight: 1920, quality: 0.82, maxBytes: 95e4 }
};
var MIN_QUALITY = 0.48;
var SKIP_REENCODE_TYPES = /* @__PURE__ */ new Set(["image/gif", "image/svg+xml"]);
var webpEncodeSupported = null;
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

// client/utils/files.ts
var VALID_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
var MAX_SOURCE_IMAGE_BYTES = 50 * 1024 * 1024;
var MAX_UPLOAD_IMAGE_BYTES = 10 * 1024 * 1024;
var MAX_CONTACT_ATTACHMENT_BYTES = 5 * 1024 * 1024;
function readOptimizedImageBlob(file, options = {}) {
  const resolved = resolveImageCompressOptions(options);
  return compressImageFile(file, {
    ...options,
    maxBytes: options.maxBytes ?? Math.min(resolved.maxBytes, MAX_UPLOAD_IMAGE_BYTES)
  });
}
function isSupportedImageType(file) {
  return VALID_IMAGE_TYPES.includes(file.type);
}
function handleFileValidation(file) {
  if (!isSupportedImageType(file)) {
    showToast(`"${file.name}" \u2014 only PNG, JPG, WebP, or GIF images are supported.`, "danger");
    return false;
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    showToast(`"${file.name}" \u2014 image is too large (max ${Math.round(MAX_SOURCE_IMAGE_BYTES / (1024 * 1024))}MB before compression).`, "danger");
    return false;
  }
  return true;
}

// lib/cms/upload-file-name.ts
function sanitizeSegment(value, maxLen = 48) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, maxLen);
}
function uploadTimestamp(date = /* @__PURE__ */ new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
function extensionFromFileName(fileName) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(String(fileName || ""));
  return match ? `.${match[1].toLowerCase()}` : "";
}
function extensionForUploadMime(mimeType) {
  const mime = String(mimeType || "application/octet-stream").split(";")[0].trim().toLowerCase();
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/zip": ".zip",
    "application/x-zip-compressed": ".zip",
    "font/woff": ".woff",
    "font/woff2": ".woff2",
    "font/ttf": ".ttf",
    "font/otf": ".otf",
    "application/font-woff": ".woff",
    "application/font-woff2": ".woff2",
    "application/x-font-woff": ".woff",
    "application/x-font-ttf": ".ttf",
    "application/x-font-otf": ".otf"
  };
  return map[mime] || extensionFromFileName("");
}
function buildUploadFileName(page, purpose, originalFileName, options = {}) {
  const pagePart = sanitizeSegment(page, 32);
  const purposePart = sanitizeSegment(purpose, 40);
  const folderPart = options.mediaFolder ? sanitizeSegment(options.mediaFolder, 24) : "";
  const stamp = uploadTimestamp();
  const seq = options.sequence != null && options.sequence > 0 ? String(options.sequence).padStart(2, "0") : "";
  const extRaw = options.extension ?? extensionFromFileName(originalFileName) ?? "";
  const ext = extRaw ? extRaw.startsWith(".") ? extRaw : `.${extRaw}` : "";
  const parts = [pagePart, purposePart];
  if (folderPart) parts.push(folderPart);
  parts.push(stamp);
  if (seq) parts.push(seq);
  const base = parts.filter(Boolean).join("-");
  return `${base}${ext || ".bin"}`;
}

// client/utils/media-upload.ts
var MediaUploadError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "MediaUploadError";
  }
};
function resolveContextualUploadName(file, options, folder, mimeType, reencoded) {
  if (options.fileName) return options.fileName;
  if (options.page && options.purpose) {
    const ext2 = reencoded ? extensionForMime(mimeType) : extensionForUploadMime(mimeType) || void 0;
    return buildUploadFileName(options.page, options.purpose, file.name, {
      mediaFolder: folder,
      sequence: options.sequence,
      extension: ext2
    });
  }
  if (!reencoded) return file.name;
  const ext = extensionForMime(mimeType);
  return file.name.replace(/\.[^.]+$/, "") + ext;
}
function resolveOptimizeForUpload(folder, mode, optimize) {
  if (optimize === false || mode === "font") return false;
  const preset = compressPresetForUploadFolder(folder);
  if (optimize && typeof optimize === "object") {
    return { preset, ...optimize };
  }
  return { preset };
}
async function prepareImageBlob(file, folder, optimize) {
  if (optimize === false) {
    if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
      throw new MediaUploadError("Image exceeds the 10MB limit. Try a smaller file.");
    }
    return { blob: file, mimeType: file.type };
  }
  const maxBytes = folder === "contact" ? MAX_CONTACT_ATTACHMENT_BYTES : MAX_UPLOAD_IMAGE_BYTES;
  const { blob, mimeType } = await readOptimizedImageBlob(file, {
    ...optimize,
    maxBytes: optimize.maxBytes ?? maxBytes
  });
  if (blob.size > maxBytes) {
    throw new MediaUploadError(
      folder === "contact" ? "Attachment is still too large after compression (5MB max)." : "Image is still too large after compression (10MB max)."
    );
  }
  return { blob, mimeType };
}
async function postUploadForm(form) {
  const res = await fetch("/api/media/upload", {
    method: "POST",
    body: form,
    credentials: "same-origin"
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new MediaUploadError("Session expired. Please sign in again.");
  }
  const raw = await res.text();
  let payload = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = {};
  }
  if (!res.ok) {
    throw new MediaUploadError(payload.error || raw || "Upload failed.");
  }
  return payload;
}
async function uploadCmsFile(file, options = {}) {
  if (!file) throw new MediaUploadError("No file selected.");
  const mode = options.mode || "image";
  const folder = options.folder || "general";
  const isRasterUpload = mode === "image" || mode === "contact" && isSupportedImageType(file);
  const optimize = isRasterUpload && options.optimize !== false ? resolveOptimizeForUpload(folder, mode, options.optimize) : false;
  if (isRasterUpload && !handleFileValidation(file)) {
    throw new MediaUploadError("Invalid image file.");
  }
  const form = new FormData();
  form.append("folder", folder);
  form.append("mode", mode);
  if (options.page) form.append("page", options.page);
  if (options.purpose) form.append("purpose", options.purpose);
  if (options.sequence != null && options.sequence > 0) {
    form.append("sequence", String(options.sequence));
  }
  form.append("originalFileName", file.name);
  let uploadBlob = file;
  let uploadMime = file.type;
  const willReencode = isRasterUpload && optimize !== false;
  if (isRasterUpload) {
    const prepared = await prepareImageBlob(file, folder, optimize);
    uploadBlob = prepared.blob;
    uploadMime = prepared.mimeType;
  }
  const uploadName = resolveContextualUploadName(
    file,
    options,
    folder,
    uploadMime,
    willReencode
  );
  form.append("file", uploadBlob, uploadName);
  const payload = await postUploadForm(form);
  if (!payload.url) throw new MediaUploadError("Upload did not return a URL.");
  return {
    url: payload.url,
    storagePath: payload.storagePath || "",
    fileName: payload.fileName || uploadName,
    size: Number(payload.size) || uploadBlob.size,
    mimeType: payload.mimeType || uploadMime,
    folder: payload.folder || folder
  };
}
async function uploadCmsFileWithPreview(file, options = {}) {
  const previewUrl = URL.createObjectURL(file);
  options.onPreview?.(previewUrl);
  try {
    return await uploadCmsFile(file, options);
  } finally {
    URL.revokeObjectURL(previewUrl);
  }
}
async function uploadContactAttachment(file) {
  if (!file) throw new MediaUploadError("No file selected.");
  if (isSupportedImageType(file)) {
    if (!handleFileValidation(file)) {
      throw new MediaUploadError("Invalid image file.");
    }
    return uploadCmsFile(file, {
      folder: "contact",
      mode: "contact",
      page: "contact-messages",
      purpose: "contact-reply-attachment",
      optimize: { preset: "general", maxBytes: MAX_CONTACT_ATTACHMENT_BYTES }
    });
  }
  if (file.size > MAX_CONTACT_ATTACHMENT_BYTES) {
    showToast("Attachment exceeds the 5MB limit.", "danger");
    throw new MediaUploadError("Attachment exceeds the 5MB limit.");
  }
  return uploadCmsFile(file, {
    folder: "contact",
    mode: "contact",
    page: "contact-messages",
    purpose: "contact-reply-attachment",
    optimize: false
  });
}
async function uploadCustomFontFile(file) {
  return uploadCmsFile(file, {
    folder: "general",
    mode: "font",
    optimize: false,
    page: "customization",
    purpose: "custom-font"
  });
}

export {
  handleFileValidation,
  MediaUploadError,
  uploadCmsFile,
  uploadCmsFileWithPreview,
  uploadContactAttachment,
  uploadCustomFontFile
};
//# sourceMappingURL=chunk-K3UG6U6W.js.map
