// @ts-nocheck
import StaffLegacyBody from '@/components/StaffLegacyBody';
import SettingsHydration from '@/components/settings/SettingsHydration';
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
  const html = buildSettingsBodyHtml(tab);

  return (
    <>
      <SettingsHydration />
      <StaffLegacyBody
        html={html}
        includeAddUserPanel
        requireAdmin={tab === 'system'}
        settingsTab={tab}
        authBody={false}
      />
    </>
  );
}
