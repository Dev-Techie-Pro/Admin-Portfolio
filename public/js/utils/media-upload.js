import {
  handleFileValidation,
  isSupportedImageType,
  MAX_CONTACT_ATTACHMENT_BYTES,
  MAX_UPLOAD_IMAGE_BYTES,
  readOptimizedImageBlob
} from "./files.js";
import {
  compressPresetForUploadFolder,
  extensionForMime
} from "./image-compress.js";
import { showToast } from "../modules/shell/toast.js";
class MediaUploadError extends Error {
  constructor(message) {
    super(message);
    this.name = "MediaUploadError";
  }
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
  let uploadBlob = file;
  let uploadMime = file.type;
  let uploadName = options.fileName || file.name;
  if (isRasterUpload) {
    const prepared = await prepareImageBlob(file, folder, optimize);
    uploadBlob = prepared.blob;
    uploadMime = prepared.mimeType;
    if (optimize !== false) {
      const ext = extensionForMime(uploadMime);
      uploadName = (options.fileName || file.name).replace(/\.[^.]+$/, "") + ext;
    }
  }
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
      optimize: { preset: "general", maxBytes: MAX_CONTACT_ATTACHMENT_BYTES }
    });
  }
  if (file.size > MAX_CONTACT_ATTACHMENT_BYTES) {
    showToast("Attachment exceeds the 5MB limit.", "danger");
    throw new MediaUploadError("Attachment exceeds the 5MB limit.");
  }
  return uploadCmsFile(file, { folder: "contact", mode: "contact", optimize: false });
}
async function uploadCustomFontFile(file) {
  return uploadCmsFile(file, { folder: "general", mode: "font", optimize: false, fileName: file.name });
}
export {
  MediaUploadError,
  uploadCmsFile,
  uploadCmsFileWithPreview,
  uploadContactAttachment,
  uploadCustomFontFile
};
