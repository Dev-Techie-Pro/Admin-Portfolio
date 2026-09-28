import LegacyBody from '@/components/LegacyBody';
import { ADD_USER_PANEL_HTML } from '@/app/addUserPanelHtml';
import { MEDIA_PICKER_PANEL_HTML } from '@/app/mediaPickerPanelHtml';
import { BODY_HTML } from './bodyHtml';
import { prepareBlogPostPageHtml } from './injectWorkspace';

export const metadata = { title: 'Portfolio Admin — Blog Posts' };

export default function Page() {
  return (
    <LegacyBody
      html={prepareBlogPostPageHtml(BODY_HTML) + MEDIA_PICKER_PANEL_HTML + ADD_USER_PANEL_HTML}
      authBody={false}
      needsCanvasJs={false}
    />
  );
}
