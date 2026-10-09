// @ts-nocheck
import StaffLegacyBody from '@/components/StaffLegacyBody';
import { BODY_HTML } from '../tags/bodyHtml';
import { injectPageHeaderMeta } from '@/lib/shell/inject-page-header';
import { STAFF_PAGE_HEADERS } from '@/lib/shell/staff-page-headers';

export const metadata = { title: 'Portfolio Admin — Project Tags' };

const PAGE_HTML = injectPageHeaderMeta(BODY_HTML, STAFF_PAGE_HEADERS.projectTags);

export default function Page() {
  return <StaffLegacyBody html={PAGE_HTML} includeAddUserPanel authBody={false} needsCanvasJs={false} />;
}
