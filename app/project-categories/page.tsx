// @ts-nocheck
import StaffLegacyBody from '@/components/StaffLegacyBody';
import { BODY_HTML } from '../categories/bodyHtml';
import { injectPageHeaderMeta } from '@/lib/shell/inject-page-header';
import { STAFF_PAGE_HEADERS } from '@/lib/shell/staff-page-headers';

export const metadata = { title: 'Portfolio Admin — Project Categories' };

const PAGE_HTML = injectPageHeaderMeta(BODY_HTML, STAFF_PAGE_HEADERS.projectCategories);

export default function Page() {
  return (
    <StaffLegacyBody
      html={PAGE_HTML}
      includeAddUserPanel
      authBody={false}
      needsCanvasJs={false}
    />
  );
}
