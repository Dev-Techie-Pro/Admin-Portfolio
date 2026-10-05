export const metadata = { title: 'Portfolio Admin — Blog Categories' };

import StaffLegacyBody from '@/components/StaffLegacyBody';
import { BODY_HTML } from './bodyHtml';
import { injectPageHeaderMeta } from '@/lib/shell/inject-page-header';
import { STAFF_PAGE_HEADERS } from '@/lib/shell/staff-page-headers';

const PAGE_HTML = injectPageHeaderMeta(BODY_HTML, STAFF_PAGE_HEADERS.blogCategories);

export default function Page() {
  return <StaffLegacyBody html={PAGE_HTML}
      includeAddUserPanel authBody={false} needsCanvasJs={false} />;
}
