const TAB_SECTION_ICONS = {
  general: "ri-information-line",
  media: "ri-image-line",
  additional: "ri-link",
  publishing: "ri-upload-cloud-2-line",
  content: "ri-article-line",
  details: "ri-briefcase-line",
  dates: "ri-calendar-line",
  seo: "ri-search-eye-line",
  settings: "ri-settings-3-line"
};
const PANEL_ICONS = {
  project: "ri-layout-grid-line",
  testimonial: "ri-chat-quote-line",
  experience: "ri-briefcase-line",
  technolog: "ri-code-s-slash-line",
  tool: "ri-tools-line",
  categor: "ri-folder-line",
  tag: "ri-price-tag-3-line",
  blog: "ri-article-line",
  media: "ri-image-line",
  user: "ri-user-line"
};
function panelIcon(panelId, title) {
  const hay = `${panelId} ${title}`.toLowerCase();
  const key = Object.keys(PANEL_ICONS).find((k) => hay.includes(k));
  return key ? PANEL_ICONS[key] : "ri-edit-box-line";
}
function tabIcon(tabKey, label) {
  const k = tabKey.toLowerCase();
  if (TAB_SECTION_ICONS[k]) return TAB_SECTION_ICONS[k];
  const labelKey = label.toLowerCase();
  const fromLabel = Object.keys(TAB_SECTION_ICONS).find((t) => labelKey.includes(t));
  return fromLabel ? TAB_SECTION_ICONS[fromLabel] : "ri-layout-column-line";
}
function panelSubtitle(titleText) {
  const t = titleText.toLowerCase();
  if (t.includes("add new")) return "Create a new item and fill in the details below.";
  if (t.startsWith("add ")) return "Create a new item and fill in the details below.";
  if (t.includes("edit")) return "Update content and settings.";
  return "Fill in the details below.";
}
function wireSidebarToggles(root) {
  root.querySelectorAll("[data-ws-panel-toggle]").forEach((btn) => {
    if (btn.dataset.wsToggleWired === "1") return;
    btn.dataset.wsToggleWired = "1";
    btn.addEventListener("click", () => {
      const section = btn.closest("[data-ws-panel]");
      if (!section) return;
      const open = section.classList.toggle("is-collapsed");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
}
function createSidebarSection(title, icon, contentParent) {
  const section = document.createElement("section");
  section.className = "pa-blog-ws-panel is-collapsed";
  section.dataset.wsPanel = "1";
  const head = document.createElement("button");
  head.type = "button";
  head.className = "pa-blog-ws-panel-head";
  head.dataset.wsPanelToggle = "1";
  head.setAttribute("aria-expanded", "true");
  head.innerHTML = `<span class="pa-blog-ws-panel-head-left"><i class="${icon}"></i> ${title}</span><i class="ri-arrow-down-s-line pa-blog-ws-panel-chevron" aria-hidden="true"></i>`;
  const body = document.createElement("div");
  body.className = "pa-blog-ws-panel-body pa-ws-form-grid";
  while (contentParent.firstChild) body.appendChild(contentParent.firstChild);
  section.append(head, body);
  return section;
}
function createSidebarSectionFromNodes(title, icon, nodes) {
  const bucket = document.createElement("div");
  nodes.forEach((n) => bucket.appendChild(n));
  return createSidebarSection(title, icon, bucket);
}
function groupByFormId(root, id) {
  const el = root.querySelector(`#${id}`);
  return el?.closest(".pa-form-group");
}
function applyMainBlogFieldClasses(main) {
  main.querySelectorAll(".pa-form-group").forEach((group) => {
    if (group.querySelector(".pa-rte")) {
      group.classList.add("pa-blog-ws-content-field");
      group.querySelector(".pa-rte")?.classList.add("pa-blog-ws-rte");
      const label = group.querySelector(".pa-form-label");
      if (label && !group.querySelector(".pa-blog-ws-content-label-row")) {
        const row = document.createElement("div");
        row.className = "pa-blog-ws-content-label-row";
        group.insertBefore(row, group.firstChild);
        row.appendChild(label);
      }
    } else if (group.querySelector('.pa-form-input[type="text"], .pa-form-input:not([type])')) {
      group.classList.add("pa-blog-ws-field");
    }
  });
}
function splitProjectWorkspace(main, sidebar, panelId) {
  const prefix = panelId === "paAddPanel" ? "add" : panelId === "paEditPanel" ? "edit" : "";
  if (!prefix) return;
  const titleGroup = groupByFormId(main, `${prefix}Title`);
  const rteGroup = groupByFormId(main, `${prefix}RteWrap`) || main.querySelector(".pa-rte")?.closest(".pa-form-group") || null;
  const categoryGroup = groupByFormId(main, `${prefix}Category`);
  const shortDescGroup = groupByFormId(main, `${prefix}ShortDesc`);
  const techGroup = main.querySelector(`#${prefix}TechChips`)?.closest(".pa-form-group") || null;
  main.replaceChildren(...[titleGroup, rteGroup].filter(Boolean));
  const prepend = [];
  if (categoryGroup || shortDescGroup) {
    prepend.push(
      createSidebarSectionFromNodes(
        "Project details",
        "ri-settings-3-line",
        [categoryGroup, shortDescGroup].filter(Boolean)
      )
    );
  }
  if (techGroup) {
    prepend.push(createSidebarSectionFromNodes("Technologies", "ri-code-s-slash-line", [techGroup]));
  }
  if (prepend.length) {
    const existing = [...sidebar.children];
    sidebar.replaceChildren(...prepend, ...existing);
  }
  applyMainBlogFieldClasses(main);
}
function markWideFormGroups(root) {
  root.querySelectorAll(".pa-form-group").forEach((group) => {
    if (group.querySelector("textarea, .pa-rte, .pa-media-upload, .pa-tech-chips, .pa-gallery-grid, .pa-tech-input-wrap")) {
      group.classList.add("pa-ws-span-2");
    }
  });
}
function enhanceCrudPanelBlogLayout(panel) {
  if (panel.dataset.blogWsEnhanced === "1") {
    wireSidebarToggles(panel);
    return;
  }
  const head = panel.querySelector(".pa-panel-head");
  const body = panel.querySelector(".pa-panel-body");
  const footer = panel.querySelector(".pa-panel-footer");
  const tabs = panel.querySelector(".pa-panel-tabs");
  if (!head || !body) return;
  const titleEl = head.querySelector(".pa-panel-title");
  const titleText = titleEl?.textContent?.trim() || "Edit";
  const closeBtn = head.querySelector(".pa-panel-close");
  const icon = panelIcon(panel.id, titleText);
  head.classList.add("pa-blog-ws-head");
  head.innerHTML = "";
  const left = document.createElement("div");
  left.className = "pa-blog-ws-head-left";
  if (closeBtn) {
    closeBtn.type = "button";
    closeBtn.className = "pa-btn pa-btn-cancel pa-btn-icon pa-panel-close";
    closeBtn.setAttribute("aria-label", "Back");
    closeBtn.title = "Back";
    closeBtn.innerHTML = '<i class="ri-arrow-left-line"></i>';
    left.appendChild(closeBtn);
  } else {
    const back = document.createElement("button");
    back.type = "button";
    back.className = "pa-btn pa-btn-cancel pa-btn-icon pa-panel-close";
    back.setAttribute("aria-label", "Back");
    back.title = "Back";
    back.innerHTML = '<i class="ri-arrow-left-line"></i>';
    left.appendChild(back);
  }
  const titles = document.createElement("div");
  titles.className = "pa-blog-ws-head-titles";
  titles.innerHTML = `<h2 class="pa-blog-ws-title"><i class="${icon}" aria-hidden="true"></i> <span class="pa-panel-title">${titleText}</span></h2><p class="pa-blog-ws-subtitle pa-crud-ws-subtitle">${panelSubtitle(titleText)}</p>`;
  left.appendChild(titles);
  const actions = document.createElement("div");
  actions.className = "pa-blog-ws-head-actions";
  if (footer) {
    footer.querySelectorAll(".pa-btn-danger, .pa-btn-primary").forEach((btn) => {
      actions.appendChild(btn);
    });
    footer.querySelectorAll(".pa-btn-primary .pa-btn-label").forEach((label) => {
      if (!label.querySelector("i")) {
        const text = label.textContent?.trim() || "Save changes";
        label.innerHTML = `<i class="ri-save-line"></i> ${text}`;
      }
    });
    footer.querySelectorAll(".pa-btn-danger").forEach((btn) => {
      if (!btn.querySelector("i")) {
        btn.innerHTML = `<i class="ri-delete-bin-line"></i> ${btn.textContent?.trim() || "Delete"}`;
      }
    });
    footer.classList.add("pa-crud-ws-footer-hidden");
    footer.setAttribute("hidden", "");
  }
  head.append(left, actions);
  const tabButtons = tabs ? [...tabs.querySelectorAll(".pa-panel-tab")].map((btn) => ({
    key: btn.dataset.tab || "",
    label: btn.textContent?.trim() || "Section"
  })) : [];
  const tabPanels = [...body.querySelectorAll(":scope > .pa-tab-panel")];
  const layout = document.createElement("div");
  layout.className = "pa-blog-ws-layout";
  const main = document.createElement("div");
  main.className = "pa-blog-ws-main";
  const sidebar = document.createElement("aside");
  sidebar.className = "pa-blog-ws-sidebar";
  sidebar.setAttribute("aria-label", "Settings");
  const isProjectPanel = panel.id === "paAddPanel" || panel.id === "paEditPanel";
  if (tabPanels.length === 0) {
    const wrap = document.createElement("div");
    wrap.className = "pa-crud-ws-untabbed";
    while (body.firstChild) wrap.appendChild(body.firstChild);
    main.appendChild(wrap);
    applyMainBlogFieldClasses(main);
  } else if (tabPanels.length === 1) {
    while (tabPanels[0].firstChild) main.appendChild(tabPanels[0].firstChild);
    applyMainBlogFieldClasses(main);
  } else {
    while (tabPanels[0].firstChild) main.appendChild(tabPanels[0].firstChild);
    tabPanels.slice(1).forEach((pane, i) => {
      const meta = tabButtons[i + 1];
      const key = meta?.key || pane.dataset.content || pane.dataset.tab || `section-${i}`;
      const label = meta?.label || pane.dataset.sectionTitle || `Section ${i + 1}`;
      sidebar.appendChild(createSidebarSection(label, tabIcon(key, label), pane));
    });
    if (isProjectPanel) {
      splitProjectWorkspace(main, sidebar, panel.id);
    } else {
      applyMainBlogFieldClasses(main);
    }
  }
  body.innerHTML = "";
  layout.appendChild(main);
  if (sidebar.childElementCount > 0) layout.appendChild(sidebar);
  body.appendChild(layout);
  markWideFormGroups(panel);
  panel.querySelectorAll(".pa-blog-ws-panel-body").forEach((el) => el.classList.add("pa-ws-form-grid"));
  if (tabs) {
    tabs.setAttribute("hidden", "");
    tabs.style.display = "none";
  }
  panel.querySelectorAll(".pa-tab-panel").forEach((el) => el.remove());
  panel.classList.add("pa-blog-workspace");
  panel.dataset.blogWsEnhanced = "1";
  wireSidebarToggles(panel);
}
export {
  enhanceCrudPanelBlogLayout
};
