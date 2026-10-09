// @ts-nocheck
import StaffLegacyBody from '@/components/StaffLegacyBody';
import { BODY_HTML } from './bodyHtml';

export const metadata = { title: 'Portfolio Admin — Media Library' };

export default function Page() {
  return <StaffLegacyBody html={BODY_HTML}
      includeAddUserPanel authBody={false} needsCanvasJs={false} />;
}
