export const metadata = { title: 'Portfolio Admin — Categories' };

import StaffLegacyBody from '@/components/StaffLegacyBody';
import { ICON_PICKER_PANEL_HTML } from '@/app/iconPickerPanelHtml';
import { BODY_HTML } from './bodyHtml';
import { injectPageHeaderMeta } from '@/lib/shell/inject-page-header';
import { STAFF_PAGE_HEADERS } from '@/lib/shell/staff-page-headers';

const PAGE_HTML = injectPageHeaderMeta(BODY_HTML, STAFF_PAGE_HEADERS.toolCategories);

export default function Page() {
  return <StaffLegacyBody html={PAGE_HTML + ICON_PICKER_PANEL_HTML}
      includeAddUserPanel authBody={false} needsCanvasJs={false} />;
}
