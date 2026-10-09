// @ts-nocheck
import StaffLegacyBody from '@/components/StaffLegacyBody';
import { BODY_HTML } from './bodyHtml';

export const metadata = { title: 'Portfolio Admin — Users' };

export default function Page() {
  return (
    <StaffLegacyBody
      html={BODY_HTML}
      includeAddUserPanel
      includeInviteUserPanel
      requireAdmin
      authBody={false}
      needsCanvasJs={false}
    />
  );
}
