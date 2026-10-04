import StaffLegacyBody from '@/components/StaffLegacyBody';
import { MEDIA_PICKER_PANEL_HTML } from '@/app/mediaPickerPanelHtml';
import { BODY_HTML } from './bodyHtml';
import { prepareBlogPostPageHtml } from './injectWorkspace';

export const metadata = { title: 'Portfolio Admin — Blog Posts' };

export default function Page() {
  return (
    <StaffLegacyBody
      html={prepareBlogPostPageHtml(BODY_HTML) + MEDIA_PICKER_PANEL_HTML}
      includeAddUserPanel
      authBody={false}
      needsCanvasJs={false}
    />
  );
}
