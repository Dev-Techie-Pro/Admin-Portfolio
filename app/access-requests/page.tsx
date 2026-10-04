import StaffLegacyBody from '@/components/StaffLegacyBody';
import { BODY_HTML } from './bodyHtml';

export const metadata = { title: 'Portfolio Admin — Access Requests' };

export default function Page() {
  return (
    <StaffLegacyBody
      html={BODY_HTML}
      requireAdmin
      authBody={false}
      needsCanvasJs={false}
    />
  );
}
