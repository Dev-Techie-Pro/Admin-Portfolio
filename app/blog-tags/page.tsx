import StaffLegacyBody from '@/components/StaffLegacyBody';
import { BODY_HTML } from '../tags/bodyHtml';

export const metadata = { title: 'Portfolio Admin — Blog Tags' };

export default function Page() {
  return <StaffLegacyBody html={BODY_HTML} includeAddUserPanel authBody={false} needsCanvasJs={false} />;
}
