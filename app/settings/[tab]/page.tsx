import LegacyBody from '@/components/LegacyBody';
import { ADD_USER_PANEL_HTML } from '@/app/addUserPanelHtml';
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
  const html = buildSettingsBodyHtml(tab) + ADD_USER_PANEL_HTML + CUSTOM_PANEL_HTML;

  return (
    <LegacyBody
      html={html}
      authBody={false}
    />
  );
}
