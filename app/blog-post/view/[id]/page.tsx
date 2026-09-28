import LegacyBody from '@/components/LegacyBody';
import { BODY_HTML } from '../bodyHtml';

export const metadata = { title: 'Portfolio Admin — Blog Post' };

export default function BlogPostViewPage() {
  return (
    <LegacyBody
      html={BODY_HTML}
      standaloneBody={true}
      needsCanvasJs={false}
    />
  );
}
