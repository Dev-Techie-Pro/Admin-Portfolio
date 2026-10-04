import StaffLegacyBody from '@/components/StaffLegacyBody';
import { BODY_HTML } from '../categories/bodyHtml';

export const metadata = { title: 'Portfolio Admin — Project Categories' };

export default function Page() {
  return (
    <StaffLegacyBody
      html={BODY_HTML}
      includeAddUserPanel
      authBody={false}
      needsCanvasJs={false}
    />
  );
}
