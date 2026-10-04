import { NextResponse } from 'next/server';
import { guardStaff } from '@/lib/auth/guard';
import {
  assertAllowedUpload,
  uploadMediaBuffer,
} from '@/lib/cms/media-storage';
import {
  buildUploadFileName,
  extensionForUploadMime,
  isUploadPage,
  isUploadPurpose,
} from '@/lib/cms/upload-file-name';

/** Staff self-service profile media (viewers cannot use general CMS upload). */
function isStaffSelfProfileMediaUpload(pageRaw: string, purposeRaw: string, folder: string) {
  if (folder !== 'avatars') return false;
  if (pageRaw === 'settings' && (purposeRaw === 'profile-avatar' || purposeRaw === 'profile-cover')) {
    return true;
  }
  if (pageRaw === 'shell' && purposeRaw === 'user-avatar') {
    return true;
  }
  return false;
}

export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'File is required.' }, { status: 400 });
    }

    const folder = String(form.get('folder') || 'general');
    const pageRaw = String(form.get('page') || '').trim();
    const purposeRaw = String(form.get('purpose') || '').trim();

    const auth = await guardStaff();
    if (!auth.ok) return auth.response;

    const caps = auth.capabilities;
    const selfProfileMedia = isStaffSelfProfileMediaUpload(pageRaw, purposeRaw, folder);
    if (!caps.canManageContent && (!caps.canManageOwnAccountSettings || !selfProfileMedia)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const modeRaw = String(form.get('mode') || 'image').toLowerCase();
    const mode = modeRaw === 'contact' || modeRaw === 'font' ? modeRaw : 'image';
    const sequenceRaw = parseInt(String(form.get('sequence') || ''), 10);

    const buffer = Buffer.from(await file.arrayBuffer());
    const { mime, folder: resolvedFolder } = assertAllowedUpload({
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: buffer.length,
      folder,
      mode,
    });

    const originalFileName = String(form.get('originalFileName') || file.name || 'upload');
    let fileName = file.name || originalFileName;
    if (isUploadPage(pageRaw) && isUploadPurpose(purposeRaw)) {
      fileName = buildUploadFileName(pageRaw, purposeRaw, originalFileName, {
        mediaFolder: resolvedFolder,
        sequence: Number.isFinite(sequenceRaw) && sequenceRaw > 0 ? sequenceRaw : undefined,
        extension: extensionForUploadMime(mime) || undefined,
      });
    }

    const result = await uploadMediaBuffer({
      buffer,
      mimeType: mime,
      fileName,
      folder: resolvedFolder,
    });

    return NextResponse.json({
      ok: true,
      url: result.url,
      storagePath: result.storagePath,
      fileName: result.fileName,
      size: result.size,
      mimeType: result.mimeType,
      folder: result.folder,
    });
  } catch (error) {
    const message = error?.message || 'Upload failed.';
    const status = message.includes('limit') || message.includes('Unsupported') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
