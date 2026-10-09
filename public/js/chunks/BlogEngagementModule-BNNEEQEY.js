import {
  debounce
} from "./chunk-NGJCAR7D.js";
import {
  syncPaSelect
} from "./chunk-WJJ4NSHA.js";
import {
  BulkSelectController
} from "./chunk-HZOFH73J.js";
import {
  csvEscapeField
} from "./chunk-JWEJ6YLS.js";
import {
  Module,
  getAccessCapabilities,
  requestDelete,
  storage
} from "./chunk-3TY7DIYN.js";
import {
  $all,
  $id,
  escapeHtml
} from "./chunk-IC6SRMKJ.js";

// client/modules/blog-engagement/BlogEngagementModule.ts
var PAGE_SIZE = 8;
var LIKES_PAGE_SIZE = 12;
var AVATAR_COLORS = ["#e5484d", "#f0c040", "#22c55e", "#38bdf8", "#a78bfa", "#f472b6", "#ff6600", "#2dd4bf"];
function initials(name) {
  return (name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = hash * 31 + name.charCodeAt(i) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
function statusLabel(status) {
  return { pending: "Pending", approved: "Approved", spam: "Spam", rejected: "Rejected" }[status] || status;
}
function formatDateTime(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { date: "\u2014", time: "" };
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    };
  } catch {
    return { date: "\u2014", time: "" };
  }
}
function snippet(text, max = 72) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}\u2026`;
}
var BlogEngagementModule = class extends Module {
  constructor() {
    super({
      name: "BlogEngagement",
      initialState: {
        mainTab: "comments",
        comments: [],
        totalComments: 0,
        nextCursor: null,
        cursorStack: [null],
        page: 1,
        selectedId: null,
        statusTab: "all",
        statusFilter: "all",
        timeFilter: "all",
        postFilter: "all",
        searchQuery: "",
        likes: [],
        likesTotal: 0,
        likesPage: 1,
        likesViewMode: "grid",
        stats: null
      }
    });
    this.bulkSelect = new BulkSelectController(this, {
      containerId: "paBlogEngFeed",
      itemSelector: ".pa-beng-card",
      idAttr: "data-comment-id",
      label: "comment",
      skipRowClick: true,
      getVisibleIds: () => this.store.get("comments").map((c) => c.id),
      onBulkDelete: (ids) => void this.bulkAction(ids, "spam"),
      ids: {
        selectBtn: "paBlogEngSelectModeBtn",
        bar: "paBlogEngBulkBar",
        count: "paBlogEngBulkCount",
        selectAllBtn: "paBlogEngBulkSelectAll",
        clearBtn: "paBlogEngBulkClear",
        deleteBtn: "paBlogEngBulkSpamBtn"
      }
    });
  }
  async load() {
    if (!getAccessCapabilities().canAccessBlogEngagement) {
      this.toast("You do not have access to Comments & Likes.", "danger");
      window.location.assign("/");
      return;
    }
    await this.fetchStats();
    await this.populatePostFilter();
    await this.fetchComments(true);
    await this.fetchLikes();
  }
  async fetchStats() {
    try {
      const res = await fetch("/api/blog-engagement/stats", { credentials: "same-origin", headers: { Accept: "application/json" } });
      if (!res.ok) return;
      const stats = await res.json();
      this.store.set("stats", stats);
      this.renderStats();
    } catch {
    }
  }
  renderStats() {
    const s = this.store.get("stats") || {};
    $id("paBlogEngStatTotal").textContent = String(s.totalComments ?? 0);
    $id("paBlogEngStatPending").textContent = String(s.pending ?? 0);
    $id("paBlogEngStatApproved").textContent = String(s.approved ?? 0);
    $id("paBlogEngStatLikes").textContent = String(s.totalLikes ?? 0);
  }
  async populatePostFilter() {
    const select = $id("paBlogEngPostFilter");
    if (!select) return;
    const posts = await storage.get("pa_blog_posts", []);
    const list = Array.isArray(posts) ? posts : [];
    const sorted = [...list].sort((a, b) => String(b.title || "").localeCompare(String(a.title || "")));
    select.innerHTML = '<option value="all">All posts</option>' + sorted.map((p) => `<option value="${escapeHtml(String(p.id))}">${escapeHtml(p.title || "Untitled")}</option>`).join("");
    select.value = this.store.get("postFilter") || "all";
    syncPaSelect(select);
  }
  buildCommentsQuery(cursor) {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    if (cursor) params.set("cursor", cursor);
    const statusFilter = this.store.get("statusFilter");
    if (statusFilter && statusFilter !== "all") {
      params.set("status", statusFilter);
    } else {
      const tab = this.store.get("statusTab");
      if (tab && tab !== "all") params.set("status", tab);
    }
    const time = this.store.get("timeFilter");
    if (time && time !== "all") params.set("time", time);
    const post = this.store.get("postFilter");
    if (post && post !== "all") params.set("postId", post);
    const q = this.store.get("searchQuery")?.trim();
    if (q) params.set("q", q);
    return params;
  }
  async fetchComments(reset = false) {
    if (reset) {
      this.store.set("cursorStack", [null]);
      this.store.set("page", 1);
    }
    const stack = this.store.get("cursorStack") || [null];
    const page = this.store.get("page") || 1;
    const cursor = stack[page - 1] ?? null;
    try {
      const res = await fetch(`/api/blog-engagement/comments?${this.buildCommentsQuery(cursor)}`, {
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });
      if (res.status === 403) {
        this.toast("You do not have access to Comments & Likes.", "danger");
        window.location.assign("/");
        return;
      }
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      this.store.set("comments", data.items || []);
      this.store.set("totalComments", data.total ?? 0);
      this.store.set("nextCursor", data.nextCursor);
      this.render();
    } catch {
      this.toast("Could not load comments", "danger");
    }
  }
  async fetchLikes(resetPage = false) {
    if (resetPage) this.store.set("likesPage", 1);
    const page = this.store.get("likesPage") || 1;
    const offset = (page - 1) * LIKES_PAGE_SIZE;
    try {
      const res = await fetch(
        `/api/blog-engagement/posts?limit=${LIKES_PAGE_SIZE}&offset=${offset}`,
        { credentials: "same-origin", headers: { Accept: "application/json" } }
      );
      if (!res.ok) return;
      const data = await res.json();
      this.store.set("likes", data.items || []);
      this.store.set("likesTotal", data.total ?? 0);
      if (this.store.get("mainTab") === "likes") this.renderLikesTable();
    } catch {
    }
  }
  getFilteredComments() {
    return this.store.get("comments") || [];
  }
  render() {
    if (this.store.get("mainTab") === "likes") {
      this.renderLikesTable();
      return;
    }
    this.renderTable();
    this.renderDetail();
  }
  renderRow(c) {
    const id = String(c.id);
    const name = String(c.authorName || "");
    const { date, time } = formatDateTime(String(c.createdAt || ""));
    const bulkMode = this.bulkSelect.isSelectMode();
    const bulkSelected = this.bulkSelect.isSelected(id);
    const isSelected = id === String(this.store.get("selectedId"));
    const status = String(c.status || "pending");
    const postTitle = String(c.postTitle || "Untitled");
    const body = snippet(String(c.body || ""));
    const check = bulkMode ? `<div class="pa-beng-card-check"><input type="checkbox" class="pa-msg-bulk-checkbox" data-select-id="${escapeHtml(id)}" ${bulkSelected ? "checked" : ""} aria-label="Select comment" /></div>` : `<div class="pa-beng-card-avatar" style="background:${avatarColor(name)};">${escapeHtml(initials(name))}</div>`;
    const classes = [
      "pa-beng-card",
      isSelected ? "is-selected" : "",
      status === "pending" ? "is-pending" : "",
      bulkSelected ? "pa-selected" : ""
    ].filter(Boolean).join(" ");
    return `<article class="${classes}" data-comment-id="${escapeHtml(id)}" tabindex="0">
      ${check}
      <div class="pa-beng-card-body">
        <div class="pa-beng-card-top">
          <span class="pa-beng-card-author">${escapeHtml(name)}</span>
          <span class="pa-status-badge ${escapeHtml(status)}">${escapeHtml(statusLabel(status))}</span>
        </div>
        <div class="pa-beng-card-email">${escapeHtml(String(c.authorEmail || "\u2014"))}</div>
        <div class="pa-beng-card-post">${escapeHtml(postTitle)} \xB7 /${escapeHtml(String(c.postSlug || ""))}</div>
        <p class="pa-beng-card-snippet">${escapeHtml(body)}</p>
      </div>
      <div class="pa-beng-card-meta">
        <div class="pa-beng-card-date">${escapeHtml(date)}</div>
        <div class="pa-beng-card-time">${escapeHtml(time)}</div>
      </div>
    </article>`;
  }
  renderTable() {
    const items = this.getFilteredComments();
    const feed = $id("paBlogEngFeed");
    const total = this.store.get("totalComments") || 0;
    const page = this.store.get("page") || 1;
    const nextCursor = this.store.get("nextCursor");
    if (feed) {
      if (!items.length) {
        feed.innerHTML = `<div class="pa-empty-state"><i class="ri-chat-3-line"></i><div class="pa-empty-state-title">No comments found</div><div class="pa-empty-state-text">Adjust filters or wait for visitors to comment on your portfolio blog.</div></div>`;
      } else {
        feed.innerHTML = items.map((c) => this.renderRow(c)).join("");
      }
    }
    const info = $id("paBlogEngPaginationInfo");
    if (info) info.textContent = `Page ${page} \xB7 ${total} comment${total === 1 ? "" : "s"} total`;
    const btns = $id("paBlogEngPaginationBtns");
    if (btns) {
      const canPrev = page > 1;
      const canNext = !!nextCursor;
      btns.innerHTML = `
        <div class="pa-page-nav ${canPrev ? "" : "disabled"}" id="paBlogEngPagePrev" role="button"><i class="ri-arrow-left-s-line"></i></div>
        <div class="pa-page-nav ${canNext ? "" : "disabled"}" id="paBlogEngPageNext" role="button"><i class="ri-arrow-right-s-line"></i></div>`;
      this.on($id("paBlogEngPagePrev"), "click", () => {
        if (!canPrev) return;
        const stack = [...this.store.get("cursorStack") || [null]];
        stack.pop();
        this.store.set("cursorStack", stack);
        this.store.set("page", page - 1);
        void this.fetchComments(false);
      });
      this.on($id("paBlogEngPageNext"), "click", () => {
        if (!canNext || !nextCursor) return;
        const stack = [...this.store.get("cursorStack") || [null]];
        stack.push(nextCursor);
        this.store.set("cursorStack", stack);
        this.store.set("page", page + 1);
        void this.fetchComments(false);
      });
    }
    this.attachRowListeners();
    this.bulkSelect.onRender();
  }
  attachRowListeners() {
    const feed = $id("paBlogEngFeed");
    if (!feed) return;
    feed.querySelectorAll(".pa-beng-card").forEach((row) => {
      this.on(row, "click", (e) => {
        const target = e.target;
        if (target.closest('input[type="checkbox"]')) return;
        const id = row.getAttribute("data-comment-id");
        if (id) this.selectComment(id);
      });
      this.on(row, "keydown", (e) => {
        const ev = e;
        if (ev.key !== "Enter" && ev.key !== " ") return;
        ev.preventDefault();
        const id = row.getAttribute("data-comment-id");
        if (id) this.selectComment(id);
      });
    });
  }
  findComment(id) {
    return (this.store.get("comments") || []).find((c) => String(c.id) === String(id));
  }
  selectComment(id) {
    this.store.set("selectedId", id);
    this.renderTable();
    this.renderDetail();
  }
  renderDetail() {
    const body = $id("paBlogEngDetailBody");
    const footer = $id("paBlogEngDetailFooter");
    const id = this.store.get("selectedId");
    const c = id ? this.findComment(id) : null;
    if (!body || !footer) return;
    if (!c) {
      body.innerHTML = `<div class="pa-beng-aside-empty"><i class="ri-chat-smile-3-line"></i><p class="pa-beng-aside-empty-title">No comment selected</p><p class="pa-beng-aside-empty-text">Pick a comment from the feed to review and moderate it here.</p></div>`;
      footer.innerHTML = "";
      return;
    }
    const { date, time } = formatDateTime(String(c.createdAt || ""));
    const legacyId = c.postLegacyId != null ? String(c.postLegacyId) : "";
    body.innerHTML = `
      <div class="pa-blog-eng-detail-meta">
        <span class="pa-status-badge ${escapeHtml(String(c.status))}">${escapeHtml(statusLabel(String(c.status)))}</span>
        <span class="pa-blog-eng-detail-date">${escapeHtml(date)} ${escapeHtml(time)}</span>
      </div>
      <h3 class="pa-blog-eng-detail-author">${escapeHtml(String(c.authorName))}</h3>
      ${c.authorEmail ? `<p class="pa-blog-eng-detail-email">${escapeHtml(String(c.authorEmail))}</p>` : ""}
      <div class="pa-blog-eng-detail-post">
        <strong>${escapeHtml(String(c.postTitle || "Post"))}</strong>
        <span>/${escapeHtml(String(c.postSlug || ""))}</span>
        ${legacyId ? `<a class="pa-btn pa-btn-cancel pa-btn-sm" href="/blog-post?open=${encodeURIComponent(legacyId)}">Edit post</a>` : ""}
      </div>
      <div class="pa-blog-eng-detail-body">${escapeHtml(String(c.body || ""))}</div>`;
    footer.innerHTML = `
      <button type="button" class="pa-btn pa-btn-primary" data-detail-action="approve" data-id="${escapeHtml(String(c.id))}"><i class="ri-check-line"></i> Approve</button>
      <button type="button" class="pa-btn pa-btn-cancel" data-detail-action="spam" data-id="${escapeHtml(String(c.id))}">Spam</button>
      <button type="button" class="pa-btn pa-btn-cancel" data-detail-action="reject" data-id="${escapeHtml(String(c.id))}">Hide</button>
      <button type="button" class="pa-btn pa-btn-danger" data-detail-action="delete" data-id="${escapeHtml(String(c.id))}">Delete</button>`;
    $all("[data-detail-action]", footer).forEach((btn) => {
      this.on(btn, "click", () => {
        const action = btn.getAttribute("data-detail-action");
        const commentId = btn.getAttribute("data-id");
        if (!action || !commentId) return;
        void this.moderateOne(commentId, action);
      });
    });
  }
  async moderateOne(commentId, action) {
    if (action === "delete") {
      requestDelete(commentId, "blogcomment", "this comment");
      return;
    }
    const map = { approve: "approved", spam: "spam", reject: "rejected" };
    const status = map[action];
    if (!status) return;
    await this.patchComments([commentId], status);
  }
  async patchComments(ids, status) {
    try {
      const res = await fetch("/api/blog-engagement/comments", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ids, status })
      });
      if (!res.ok) throw new Error("failed");
      this.toast("Comment updated", "success");
      await this.fetchStats();
      await this.fetchComments(true);
      this.renderDetail();
    } catch {
      this.toast("Could not update comment", "danger");
    }
  }
  async bulkAction(ids, action) {
    const list = [...ids];
    if (!list.length) return;
    if (action === "delete") {
      try {
        const res = await fetch("/api/blog-engagement/comments", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: list, delete: true })
        });
        if (!res.ok) throw new Error("failed");
        this.toast(`${list.length} comment(s) removed`, "success");
        await this.fetchStats();
        await this.fetchComments(true);
      } catch {
        this.toast("Could not delete comments", "danger");
      }
      return;
    }
    const status = action === "approve" ? "approved" : "spam";
    await this.patchComments(list, status);
  }
  renderLikeItem(p, viewMode) {
    const legacy = p.legacyId != null ? String(p.legacyId) : "";
    const likes = Number(p.likeCount) || 0;
    const commentsOn = !!p.commentsEnabled;
    const likesOn = !!p.likesEnabled;
    const title = escapeHtml(String(p.title || "Untitled"));
    const slug = escapeHtml(String(p.slug || ""));
    const flags = `<div class="pa-beng-like-flags">
          <span class="pa-beng-flag ${commentsOn ? "is-on" : ""}"><i class="ri-chat-3-line"></i> Comments ${commentsOn ? "on" : "off"}</span>
          <span class="pa-beng-flag ${likesOn ? "is-on" : ""}"><i class="ri-thumb-up-line"></i> Likes ${likesOn ? "on" : "off"}</span>
        </div>`;
    const actions = `<div class="pa-beng-like-actions">
          <button type="button" class="pa-btn pa-btn-cancel pa-btn-sm" data-like-action="comments" data-legacy="${escapeHtml(legacy)}">View comments</button>
          <button type="button" class="pa-btn pa-btn-cancel pa-btn-sm" data-like-action="reset" data-legacy="${escapeHtml(legacy)}">Reset likes</button>
        </div>`;
    if (viewMode === "list") {
      return `<article class="pa-beng-like-row" data-legacy-id="${escapeHtml(legacy)}">
        <div class="pa-beng-like-row-main">
          <h3>${title}</h3>
          <div class="pa-beng-like-slug">/${slug}</div>
        </div>
        <div class="pa-beng-like-count">${likes}<span>likes</span></div>
        ${flags}
        ${actions}
      </article>`;
    }
    return `<article class="pa-beng-like-card" data-legacy-id="${escapeHtml(legacy)}">
        <h3>${title}</h3>
        <div class="pa-beng-like-slug">/${slug}</div>
        <div class="pa-beng-like-count">${likes}<span>likes</span></div>
        ${flags}
        ${actions}
      </article>`;
  }
  attachLikeActionListeners(root) {
    if (!root) return;
    root.querySelectorAll("[data-like-action]").forEach((btn) => {
      this.on(btn, "click", () => {
        const action = btn.getAttribute("data-like-action");
        const legacy = btn.getAttribute("data-legacy");
        if (!legacy) return;
        if (action === "comments") {
          this.store.set("mainTab", "comments");
          this.store.set("postFilter", legacy);
          const sel = $id("paBlogEngPostFilter");
          if (sel) {
            sel.value = legacy;
            syncPaSelect(sel);
          }
          this.syncMainTabs();
          void this.fetchComments(true);
          return;
        }
        if (action === "reset") void this.resetLikes(legacy);
      });
    });
  }
  setLikesViewModeFromStore() {
    const mode = this.store.get("likesViewMode") || "grid";
    const gridBtn = $id("paBlogEngLikesGridViewBtn");
    const listBtn = $id("paBlogEngLikesListViewBtn");
    gridBtn?.classList.toggle("active", mode === "grid");
    listBtn?.classList.toggle("active", mode === "list");
    const grid = $id("paBlogEngLikesGrid");
    grid?.classList.toggle("is-list", mode === "list");
  }
  renderLikesPagination() {
    const total = this.store.get("likesTotal") || 0;
    const page = this.store.get("likesPage") || 1;
    const totalPages = Math.max(1, Math.ceil(total / LIKES_PAGE_SIZE));
    const info = $id("paBlogEngLikesPaginationInfo");
    if (info) {
      const start = total === 0 ? 0 : (page - 1) * LIKES_PAGE_SIZE + 1;
      const end = Math.min(page * LIKES_PAGE_SIZE, total);
      info.textContent = total ? `Showing ${start}\u2013${end} of ${total} post${total === 1 ? "" : "s"} \xB7 Page ${page} of ${totalPages}` : "No posts";
    }
    const btns = $id("paBlogEngLikesPaginationBtns");
    if (!btns) return;
    const canPrev = page > 1;
    const canNext = page < totalPages && total > 0;
    btns.innerHTML = `
        <div class="pa-page-nav ${canPrev ? "" : "disabled"}" id="paBlogEngLikesPagePrev" role="button" aria-label="Previous page"><i class="ri-arrow-left-s-line"></i></div>
        <div class="pa-page-nav ${canNext ? "" : "disabled"}" id="paBlogEngLikesPageNext" role="button" aria-label="Next page"><i class="ri-arrow-right-s-line"></i></div>`;
    this.on($id("paBlogEngLikesPagePrev"), "click", () => {
      if (!canPrev) return;
      this.store.set("likesPage", page - 1);
      void this.fetchLikes(false);
    });
    this.on($id("paBlogEngLikesPageNext"), "click", () => {
      if (!canNext) return;
      this.store.set("likesPage", page + 1);
      void this.fetchLikes(false);
    });
  }
  renderLikesTable() {
    const grid = $id("paBlogEngLikesGrid");
    if (!grid) return;
    this.setLikesViewModeFromStore();
    const viewMode = this.store.get("likesViewMode") || "grid";
    const items = this.store.get("likes") || [];
    const total = this.store.get("likesTotal") || 0;
    if (!total) {
      grid.innerHTML = `<div class="pa-empty-state"><i class="ri-thumb-up-line"></i><div class="pa-empty-state-title">No posts yet</div><div class="pa-empty-state-text">Publish blog posts to track likes here.</div></div>`;
      this.renderLikesPagination();
      return;
    }
    if (!items.length) {
      grid.innerHTML = `<div class="pa-empty-state"><i class="ri-thumb-up-line"></i><div class="pa-empty-state-title">No posts on this page</div><div class="pa-empty-state-text">Try another page.</div></div>`;
      this.renderLikesPagination();
      return;
    }
    grid.innerHTML = items.map((p) => this.renderLikeItem(p, viewMode)).join("");
    this.attachLikeActionListeners(grid);
    this.renderLikesPagination();
  }
  async resetLikes(legacyId) {
    if (!confirm("Reset all likes for this post? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/blog-engagement/posts/${encodeURIComponent(legacyId)}/likes`, {
        method: "DELETE",
        credentials: "same-origin"
      });
      if (!res.ok) throw new Error("failed");
      this.toast("Likes reset", "success");
      await this.fetchStats();
      await this.fetchLikes(false);
    } catch {
      this.toast("Could not reset likes", "danger");
    }
  }
  syncMainTabs() {
    const tab = this.store.get("mainTab") || "comments";
    $all("#paBlogEngMainTabs .pa-beng-tab").forEach((btn) => {
      const active = btn.getAttribute("data-eng-main-tab") === tab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    const commentsPane = $id("paBlogEngPaneComments");
    const likesPane = $id("paBlogEngPaneLikes");
    if (tab === "likes") {
      commentsPane?.classList.add("pa-beng-pane--hidden");
      likesPane?.classList.remove("pa-beng-pane--hidden");
      this.store.set("selectedId", null);
      this.renderDetail();
      void this.fetchLikes(false);
    } else {
      commentsPane?.classList.remove("pa-beng-pane--hidden");
      likesPane?.classList.add("pa-beng-pane--hidden");
    }
  }
  syncStatusTabs() {
    const tab = this.store.get("statusTab") || "all";
    $all("#paBlogEngPaneComments .pa-beng-chip[data-status]").forEach((el) => {
      const active = el.getAttribute("data-status") === tab;
      el.classList.toggle("is-active", active);
      el.setAttribute("aria-selected", active ? "true" : "false");
    });
  }
  resetFilters() {
    this.store.set("statusTab", "all");
    this.store.set("statusFilter", "all");
    this.store.set("timeFilter", "all");
    this.store.set("postFilter", "all");
    this.store.set("searchQuery", "");
    const search = $id("paBlogEngToolbarSearch");
    if (search) search.value = "";
    void this.fetchComments(true);
  }
  exportCsv() {
    const rows = this.store.get("comments") || [];
    if (!rows.length) {
      this.toast("No comments on this page to export", "info");
      return;
    }
    const header = ["Author", "Email", "Post", "Slug", "Status", "Created", "Body"];
    const lines = [header.map(csvEscapeField).join(",")];
    for (const c of rows) {
      lines.push([
        c.authorName,
        c.authorEmail || "",
        c.postTitle,
        c.postSlug,
        c.status,
        c.createdAt,
        c.body
      ].map(csvEscapeField).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `blog-comments-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    this.toast("Comments exported", "success");
  }
  bindEvents() {
    this.syncMainTabs();
    this.syncStatusTabs();
    $all("#paBlogEngMainTabs .pa-beng-tab").forEach((btn) => {
      this.on(btn, "click", () => {
        const tab = btn.getAttribute("data-eng-main-tab") || "comments";
        this.store.set("mainTab", tab);
        this.syncMainTabs();
        if (tab === "likes") void this.fetchLikes(false);
        else this.render();
      });
    });
    const likesGridBtn = $id("paBlogEngLikesGridViewBtn");
    const likesListBtn = $id("paBlogEngLikesListViewBtn");
    if (likesGridBtn) {
      this.on(likesGridBtn, "click", () => {
        this.store.set("likesViewMode", "grid");
        this.renderLikesTable();
      });
    }
    if (likesListBtn) {
      this.on(likesListBtn, "click", () => {
        this.store.set("likesViewMode", "list");
        this.renderLikesTable();
      });
    }
    $all("#paBlogEngPaneComments .pa-beng-chip[data-status]").forEach((tab) => {
      this.on(tab, "click", () => {
        const status = tab.getAttribute("data-status") || "all";
        this.store.set("statusTab", status);
        this.store.set("statusFilter", status);
        this.syncStatusTabs();
        void this.fetchComments(true);
      });
    });
    this.on($id("paBlogEngStatusFilter"), "change", (e) => {
      this.store.set("statusFilter", e.target.value);
      this.store.set("statusTab", e.target.value);
      this.syncStatusTabs();
      void this.fetchComments(true);
    });
    this.on($id("paBlogEngTimeFilter"), "change", (e) => {
      this.store.set("timeFilter", e.target.value);
      void this.fetchComments(true);
    });
    this.on($id("paBlogEngPostFilter"), "change", (e) => {
      this.store.set("postFilter", e.target.value);
      void this.fetchComments(true);
    });
    const debouncedSearch = debounce(() => void this.fetchComments(true), 350);
    this.on($id("paBlogEngToolbarSearch"), "input", (e) => {
      this.store.set("searchQuery", e.target.value);
      debouncedSearch();
    });
    this.on($id("paBlogEngExportBtn"), "click", () => this.exportCsv());
    this.on($id("paBlogEngDetailClose"), "click", () => {
      this.store.set("selectedId", null);
      this.renderTable();
      this.renderDetail();
    });
    this.on($id("paBlogEngDetailDelete"), "click", () => {
      const id = this.store.get("selectedId");
      if (id) void this.moderateOne(id, "delete");
    });
    this.on($id("paBlogEngBulkApproveBtn"), "click", () => {
      const bulk = this.bulkSelect;
      void this.bulkAction(bulk.selectedIds, "approve");
    });
    this.onBus("confirm:confirmed", ({ id, type }) => {
      if (type === "blogcomment") void this.deleteById(String(id));
    });
  }
  async deleteById(id) {
    try {
      const res = await fetch("/api/blog-engagement/comments", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], delete: true })
      });
      if (!res.ok) throw new Error("failed");
      this.store.set("selectedId", null);
      await this.fetchStats();
      await this.fetchComments(true);
      this.toast("Comment deleted", "success");
    } catch {
      this.toast("Could not delete comment", "danger");
    }
  }
};
export {
  BlogEngagementModule
};
//# sourceMappingURL=BlogEngagementModule-BNNEEQEY.js.map
