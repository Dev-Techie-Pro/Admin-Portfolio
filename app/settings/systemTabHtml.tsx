import { buildSystemEnvFormHtml } from './buildSystemEnvFormHtml';

const SYSTEM_ENV_FORM_HTML = buildSystemEnvFormHtml();

export const SYSTEM_TAB_HTML = `
            <div class="pa-tab-panel" data-panel="settings" data-content="system">
                <div class="pa-tab-panel active" data-panel="system-section" data-content="database">
                <section class="pa-bkp-section" id="systemBackupSection">
                    <div class="pa-bkp-layout">
                        <div class="pa-info-box mb-16 pa-bkp-layout-status" id="systemBackupStatus" hidden></div>
                        <div class="pa-bkp-main">
                            <div class="pa-bkp-list-wrap">
                                <div class="pa-bkp-header pa-bkp-layout-head">
                                    <div class="pa-bkp-header-copy">
                                        <div class="pa-bkp-header-icon" aria-hidden="true"><i class="ri-database-2-line"></i></div>
                                        <div>
                                            <h2 class="pa-bkp-title">Database Manager</h2>
                                            <p class="pa-bkp-subtitle">Manage, organize, and backup your database tables.</p>
                                        </div>
                                    </div>
                                    <div class="pa-bkp-header-actions">
                                        <button class="pa-btn pa-btn-primary flex-0-auto" type="button" id="systemBulkExportSqlBtn" disabled><i class="ri-download-2-line"></i> Download SQL Backup</button>
                                        <button class="pa-btn pa-btn-secondary flex-0-auto" type="button" id="systemBulkExportSchemaBtn"><i class="ri-file-code-line"></i> Schema Guide</button>
                                        <button class="pa-btn pa-btn-secondary max-w" type="button" id="systemBackupRefreshBtn" title="Refresh tables"><i class="ri-refresh-line"></i></button>
                                    </div>
                                </div>
                                <div class="pa-bkp-list-head">
                                    <div class="pa-bkp-list-head-left">
                                        <span class="pa-bkp-list-title"><i class="ri-table-line"></i> Tables (<span id="systemTableCount">0</span>)</span>
                                        <div class="pa-bkp-list-head-left-bottom">
                                            <span class="pa-tag" id="systemTableBulkCount">0 tables selected</span>
                                            <span class="pa-text-mute fs-sm" id="systemTableBulkSize">Total size: —</span>
                                        </div>
                                    </div>
                                    <div class="pa-bkp-list-head-right">
                                        <div class="pa-view-toggle pa-bkp-view-toggle" role="group" aria-label="View mode">
                                            <button class="pa-view-btn active" type="button" id="systemTableGridViewBtn" title="Grid view" aria-label="Grid view"><i class="ri-layout-grid-fill"></i></button>
                                            <button class="pa-view-btn" type="button" id="systemTableListViewBtn" title="List view" aria-label="List view"><i class="ri-list-unordered"></i></button>
                                        </div>
                                    </div>
                                </div>

                                <div class="pa-bkp-table-toolbar">
                                    <div class="pa-search pa-bkp-table-search">
                                        <i class="ri-search-line"></i>
                                        <input type="search" id="systemTableSearch" placeholder="Search tables…" aria-label="Search tables" autocomplete="off" />
                                    </div>
                                    <select class="pa-filter-select pa-bkp-size-filter" id="systemTableCategoryFilter" aria-label="Filter by category">
                                        <option value="all">All Categories</option>
                                    </select>
                                    <select class="pa-filter-select pa-bkp-size-filter" id="systemTableSizeFilter" aria-label="Filter by size">
                                        <option value="all">All Sizes</option>
                                        <option value="small">Small (&lt; 100 KB)</option>
                                        <option value="medium">Medium (100 KB – 1 MB)</option>
                                        <option value="large">Large (&gt; 1 MB)</option>
                                    </select>
                                    <div class="pa-bkp-table-toolbar-actions">
                                        <button class="pa-btn pa-btn-secondary pa-btn-sm flex-0-auto" type="button" id="systemTableSelectAll"><i class="ri-checkbox-multiple-line"></i> Select all</button>
                                        <button class="pa-btn pa-btn-secondary pa-btn-sm flex-0-auto" type="button" id="systemTableClearAll"><i class="ri-checkbox-blank-line"></i> Clear</button>
                                    </div>
                                </div>

                                <div class="pa-bkp-grid-wrap" id="systemTableGridWrap">
                                    <div class="pa-bkp-grid" id="systemTableGridBody" aria-live="polite">
                                        <div class="pa-bkp-loading"><span class="pa-spinner"></span> Loading tables…</div>
                                    </div>
                                </div>

                                <div class="pa-bkp-list-view" id="systemTableListWrap" hidden>
                                    <div class="pa-bkp-data-table-wrap">
                                        <table class="pa-act-table pa-bkp-data-table" aria-label="Database tables">
                                            <thead>
                                                <tr>
                                                    <th class="pa-bkp-col-check" scope="col">
                                                        <label class="pa-bkp-table-picker-master">
                                                            <input type="checkbox" class="pa-msg-bulk-checkbox" id="systemTableMasterCheck" aria-label="Select all visible tables" />
                                                        </label>
                                                    </th>
                                                    <th scope="col">Table Name</th>
                                                    <th scope="col">Description</th>
                                                    <th class="pa-bkp-col-num" scope="col">Rows</th>
                                                    <th class="pa-bkp-col-num" scope="col">Size</th>
                                                    <th scope="col">Type</th>
                                                    <th class="pa-bkp-col-actions" scope="col">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody id="systemTableListBody">
                                                <tr><td colspan="7"><div class="pa-bkp-loading"><span class="pa-spinner"></span> Loading tables…</div></td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div class="pa-pagination pa-bkp-pagination">
                                        <div class="pa-bkp-page-size">
                                            <label class="pa-text-mute fs-sm" for="systemTablePageSize">Rows per page:</label>
                                            <select class="pa-filter-select pa-bkp-page-size-select" id="systemTablePageSize" aria-label="Rows per page">
                                                <option value="10" selected>10</option>
                                                <option value="20">20</option>
                                                <option value="50">50</option>
                                            </select>
                                        </div>
                                        <div class="pa-pagination-btns" id="systemTablePaginationBtns"></div>
                                        <div class="pa-pagination-info" id="systemTablePaginationInfo">Showing 0 of 0</div>
                                    </div>
                                </div>
                            </div>

                            <div class="pa-bkp-history mt-16">
                                <div class="pa-bkp-list-head">
                                    <span class="pa-bkp-list-title"><i class="ri-history-line"></i> Recent Exports</span>
                                    <span class="pa-bkp-list-count" id="systemExportHistoryCount">0 items</span>
                                </div>
                                <div class="pa-bkp-history-list" id="systemExportHistoryBody">
                                    <div class="pa-bkp-loading"><span class="pa-spinner"></span> Loading export history…</div>
                                </div>
                            </div>
                        </div>

                        <aside class="pa-bkp-sidebar" aria-label="Table details">
                            <div class="pa-bkp-side-card">
                                <div class="pa-bkp-side-head">
                                    <span class="pa-bkp-side-title"><i class="ri-information-line"></i> Table Details</span>
                                </div>
                                <div class="pa-bkp-detail" id="systemDbDetailPanel">
                                    <div class="pa-bkp-detail-empty">
                                        <i class="ri-cursor-line"></i>
                                        <div>Select a table to view details</div>
                                    </div>
                                </div>
                            </div>

                            <div class="pa-bkp-side-card">
                                <div class="pa-bkp-side-head">
                                    <span class="pa-bkp-side-title"><i class="ri-flashlight-line"></i> Table Actions</span>
                                </div>
                                <div class="pa-bkp-detail-actions" id="systemDbSideActions">
                                    <button class="pa-btn pa-btn-primary" type="button" id="systemDbViewStructureBtn" disabled><i class="ri-eye-line"></i> View Structure</button>
                                    <button class="pa-btn pa-btn-secondary" type="button" id="systemDbExportTableBtn" disabled><i class="ri-download-2-line"></i> Export Data</button>
                                    <button class="pa-btn pa-btn-secondary" type="button" id="systemDbSqlEditorBtn" disabled><i class="ri-code-line"></i> Copy SQL Query</button>
                                </div>
                            </div>

                            <div class="pa-bkp-side-card">
                                <div class="pa-bkp-side-head">
                                    <span class="pa-bkp-side-title"><i class="ri-pie-chart-2-line"></i> Quick Stats</span>
                                </div>
                                <div class="pa-bkp-size-chart" id="systemDbSizeChart">
                                    <div class="pa-bkp-detail-empty">
                                        <i class="ri-pie-chart-line"></i>
                                        <div>Select a table to see size share</div>
                                    </div>
                                </div>
                            </div>

                            <div class="pa-bkp-side-card pa-bkp-side-card--grow">
                                <div class="pa-bkp-side-head">
                                    <span class="pa-bkp-side-title"><i class="ri-history-line"></i> Recent Activity</span>
                                </div>
                                <div class="pa-bkp-history-list pa-bkp-history-list--side" id="systemDbRecentActivity">
                                    <div class="pa-bkp-loading"><span class="pa-spinner"></span> Loading…</div>
                                </div>
                            </div>

                            <div class="pa-bkp-side-footer" id="systemDbOverview">
                                <span><i class="ri-database-2-line"></i> Total Tables: <strong id="systemDbOverviewTables">0</strong></span>
                                <span><i class="ri-hard-drive-2-line"></i> Total Size: <strong id="systemDbOverviewSize">—</strong></span>
                                <span><i class="ri-layout-grid-line"></i> Avg. Size: <strong id="systemDbOverviewAvg">—</strong></span>
                            </div>
                        </aside>
                    </div>
                </section>
                </div>

                <div class="pa-tab-panel" data-panel="system-section" data-content="env">
                <div class="pa-info-box mt-10 mb-16" id="systemEnvMeta">Loading environment settings…</div>
                ${SYSTEM_ENV_FORM_HTML}
                </div>
            </div>`;
