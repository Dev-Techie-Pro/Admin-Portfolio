// @ts-nocheck
import StaffLegacyBody from '@/components/StaffLegacyBody';
import { MEDIA_PICKER_PANEL_HTML } from '@/app/mediaPickerPanelHtml';
import { BODY_HTML } from './bodyHtml';
import { prepareProjectPageHtml } from './injectWorkspace';

export const metadata = { title: 'Portfolio Admin — Projects' };

export default function Page() {
  return (
    <StaffLegacyBody
      html={prepareProjectPageHtml(BODY_HTML) + MEDIA_PICKER_PANEL_HTML}
      includeAddUserPanel
      authBody={false}
      needsCanvasJs={false}
    />
  );
}
