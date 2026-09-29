/** Database / Environment segmented toggle — injected into settings page header on System route. */
export const SYSTEM_SECTION_TOOLBAR_HTML = `
                <div class="pa-settings-toolbar pa-system-section-toolbar" id="systemSectionTabs">
                    <div class="pa-view-toggle pa-system-section-toggle" role="tablist" aria-label="System sections">
                        <button type="button" class="pa-view-btn active" data-panel="system-section" data-tab="database" role="tab" aria-selected="true"><i class="ri-database-2-line"></i> Database</button>
                        <button type="button" class="pa-view-btn" data-panel="system-section" data-tab="env" role="tab" aria-selected="false"><i class="ri-terminal-box-line"></i> Environment</button>
                    </div>
                </div>`;
