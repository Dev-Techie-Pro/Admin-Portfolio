import LegacyBoot from './LegacyBoot';
import LegacyHtml from './LegacyHtml';

/**
 * LegacyBody — renders one page's original body markup on the server, then
 * boots the vanilla module system via LegacyBoot (client-only).
 */

type LegacyBodyProps = {
  html: string;
  authBody?: boolean;
  standaloneBody?: boolean;
  needsCanvasJs?: boolean;
};

export default function LegacyBody({
  html,
  authBody = false,
  standaloneBody = false,
  needsCanvasJs = false,
}: LegacyBodyProps) {
  return (
    <>
      <LegacyHtml html={html} />
      <LegacyBoot authBody={authBody} standaloneBody={standaloneBody} needsCanvasJs={needsCanvasJs} />
    </>
  );
}
