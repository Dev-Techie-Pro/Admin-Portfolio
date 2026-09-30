import { redirect } from 'next/navigation';
import LegacyBody from '@/components/LegacyBody';
import { requireStaffPageContext } from '@/lib/auth/require-staff-page';
import { personalizePageHtml } from '@/lib/shell/html-access';
import { ADD_USER_PANEL_HTML } from '@/app/addUserPanelHtml';

type StaffLegacyBodyProps = {
  html: string;
  extraHtml?: string;
  /** Append add-user panels only when the signed-in user is an admin. */
  includeAddUserPanel?: boolean;
  /** Redirect to dashboard when the user is not an admin. */
  requireAdmin?: boolean;
  /** Redirect when the user cannot access editor features (e.g. blog engagement). */
  requireEditor?: boolean;
  authBody?: boolean;
  standaloneBody?: boolean;
  needsCanvasJs?: boolean;
};

/**
 * Server-rendered legacy dashboard page: HTML is trimmed to the user's role
 * before it is sent to the browser. API routes still enforce authorization.
 */
export default async function StaffLegacyBody({
  html,
  extraHtml = '',
  includeAddUserPanel = false,
  requireAdmin = false,
  requireEditor = false,
  authBody = false,
  standaloneBody = false,
  needsCanvasJs = false,
}: StaffLegacyBodyProps) {
  const { capabilities } = await requireStaffPageContext();

  if (requireAdmin && !capabilities.isAdmin) {
    redirect('/');
  }
  if (requireEditor && !capabilities.canAccessBlogEngagement) {
    redirect('/');
  }

  let combined = html + extraHtml;
  if (includeAddUserPanel && capabilities.isAdmin) {
    combined += ADD_USER_PANEL_HTML;
  }

  const personalized = personalizePageHtml(combined, capabilities);

  return (
    <LegacyBody
      html={personalized}
      authBody={authBody}
      standaloneBody={standaloneBody}
      needsCanvasJs={needsCanvasJs}
    />
  );
}
