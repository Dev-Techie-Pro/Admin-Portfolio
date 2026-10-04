export const metadata = { title: 'Portfolio Admin — Blog Categories' };

import StaffLegacyBody from '@/components/StaffLegacyBody';
import { BODY_HTML } from './bodyHtml';

export default function Page() {
  return <StaffLegacyBody html={BODY_HTML}
      includeAddUserPanel authBody={false} needsCanvasJs={false} />;
}
