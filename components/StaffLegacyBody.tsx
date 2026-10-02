import { redirect } from 'next/navigation';
import LegacyBody from '@/components/LegacyBody';
import { requireStaffPageContext } from '@/lib/auth/require-staff-page';
import { personalizePageHtml } from '@/lib/shell/html-access';
import { ADD_USER_PANEL_HTML } from '@/app/addUserPanelHtml';
import { CUSTOM_PANEL_HTML } from '@/app/customPanelHtml';
import { INVITE_USER_PANEL_HTML } from '@/app/inviteUserPanelHtml';
import { STAFF_INVITE_LINK_MODAL_HTML } from '@/app/staffInviteLinkModalHtml';
import { QUICK_ADD_PANEL_HTML } from '@/app/quickAddPanelHtml';
import { canAccessSettingsTab } from '@/lib/auth/capabilities';

type StaffLegacyBodyProps = {
  html: string;
  extraHtml?: string;
  /** Append add-user panels only when the signed-in user is an admin. */
  includeAddUserPanel?: boolean;
  /** Append invite-by-email panel (users page). */
  includeInviteUserPanel?: boolean;
  /** Redirect to dashboard when the user is not an admin. */
  requireAdmin?: boolean;
  /** Redirect when the user cannot access editor features (e.g. blog engagement). */
  requireEditor?: boolean;
  /** When set, redirect viewers away from disallowed settings tabs. */
  settingsTab?: string;
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
  includeInviteUserPanel = false,
  requireAdmin = false,
  requireEditor = false,
  settingsTab,
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
  if (settingsTab && !canAccessSettingsTab(settingsTab, capabilities)) {
    redirect('/settings/profile');
  }

  let combined = html + extraHtml;
  if (capabilities.canManageContent) {
    combined += QUICK_ADD_PANEL_HTML;
  }
  if (includeAddUserPanel && capabilities.isAdmin) {
    combined += ADD_USER_PANEL_HTML;
  }
  if (!authBody && !standaloneBody) {
    combined += CUSTOM_PANEL_HTML;
  }
  if (includeInviteUserPanel && capabilities.isAdmin) {
    combined += INVITE_USER_PANEL_HTML;
    combined += STAFF_INVITE_LINK_MODAL_HTML;
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
