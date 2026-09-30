export const metadata = { title: 'Portfolio Admin — Tools' };

import StaffLegacyBody from '@/components/StaffLegacyBody';
import { ICON_PICKER_PANEL_HTML } from '@/app/iconPickerPanelHtml';
import { BODY_HTML } from './bodyHtml';

export default function Page() {
  return <StaffLegacyBody html={BODY_HTML + ICON_PICKER_PANEL_HTML}
      includeAddUserPanel authBody={false} needsCanvasJs={false} />;
}
