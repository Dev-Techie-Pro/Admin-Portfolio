import StaffLegacyBody from '@/components/StaffLegacyBody';
import { CUSTOM_PANEL_HTML } from '@/app/customPanelHtml';
import { buildSettingsBodyHtml } from '../buildBodyHtml';
import { getSettingsPageMeta, resolveSettingsTab, SETTINGS_TABS } from '@/lib/settings/page-meta';

export async function generateMetadata({ params }) {
  const tab = resolveSettingsTab(params?.tab);
  const meta = getSettingsPageMeta(tab);
  return { title: `Portfolio Admin — ${meta.title}` };
}

export function generateStaticParams() {
  return SETTINGS_TABS.map((tab) => ({ tab }));
}

export default function SettingsTabPage({ params }) {
  const tab = resolveSettingsTab(params?.tab);
  const html = buildSettingsBodyHtml(tab) + CUSTOM_PANEL_HTML;

  return (
    <StaffLegacyBody
      html={html}
      includeAddUserPanel
      requireAdmin={tab === 'system'}
      settingsTab={tab}
      authBody={false}
    />
  );
}
