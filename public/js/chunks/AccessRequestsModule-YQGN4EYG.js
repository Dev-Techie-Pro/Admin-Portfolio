import {
  Module,
  requestBulkAction
} from "./chunk-W73CLJTU.js";
import {
  $id,
  escapeHtml,
  showToast
} from "./chunk-B2QR3Q5R.js";

// client/modules/access-requests/AccessRequestsModule.ts
function formatDateTime(iso) {
  if (!iso) return "\u2014";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "\u2014";
    return d.toLocaleString(void 0, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "\u2014";
  }
}
function statusBadge(status) {
  const map = {
    pending: { cls: "warning", label: "Pending" },
    approved: { cls: "success", label: "Approved" },
    rejected: { cls: "danger", label: "Rejected" }
  };
  const meta = map[status] || { cls: "info", label: status };
  return `<span class="pa-badge pa-badge--${meta.cls}">${escapeHtml(meta.label)}</span>`;
}
var AccessRequestsModule = class extends Module {
  constructor() {
    super({
      name: "AccessRequests",
      storageKey: null,
      initialState: {
        items: [],
        filter: "all",
        loading: false
      }
    });
  }
  async load() {
    await this.fetchList();
  }
  async fetchList() {
    this.store.set("loading", true);
    try {
      const res = await fetch("/api/admin/access-requests", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load requests.");
      this.store.set("items", Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      showToast(err?.message || "Could not load requests.", "danger");
      this.store.set("items", []);
    } finally {
      this.store.set("loading", false);
      this.render();
    }
  }
  filteredItems() {
    const filter = this.store.get("filter");
    const items = this.store.get("items") || [];
    if (filter === "all") return items;
    return items.filter((item) => item.status === filter);
  }
  render() {
    const list = $id("paAccessRequestsList");
    const empty = $id("paAccessRequestsEmpty");
    const countEl = $id("paAccessRequestsCount");
    if (!list) return;
    const items = this.filteredItems();
    if (countEl) {
      countEl.textContent = `${items.length} request${items.length === 1 ? "" : "s"}`;
    }
    if (!items.length) {
      list.innerHTML = "";
      empty?.removeAttribute("hidden");
      return;
    }
    empty?.setAttribute("hidden", "");
    list.innerHTML = items.map((item) => this.renderCard(item)).join("");
  }
  renderCard(item) {
    const name = escapeHtml(item.requesterName || item.requesterEmail || "Staff");
    const role = escapeHtml(String(item.requesterRole || "").replace(/_/g, " "));
    const message = escapeHtml(item.message || "");
    const contact = escapeHtml(item.contactEmail || "");
    const pending = item.status === "pending";
    const durationBlock = pending ? `<div class="pa-access-request-duration">
          <label class="pa-form-label" for="paAccessDuration-${item.id}">Editor role duration</label>
          <div class="pa-access-request-duration-row">
            <select class="pa-form-select" id="paAccessDuration-${item.id}" data-duration-select="${item.id}">
              <option value="1">1 hour</option>
              <option value="3" selected>3 hours</option>
              <option value="6">6 hours</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours</option>
              <option value="custom">Custom\u2026</option>
            </select>
            <input class="pa-form-input pa-access-duration-custom" type="number" min="1" max="72" step="1"
              placeholder="Hours (1\u201372)" data-duration-custom="${item.id}" hidden>
          </div>
        </div>` : "";
    const actions = pending ? `${durationBlock}<div class="pa-access-request-actions">
          <button type="button" class="pa-btn pa-btn-primary pa-btn-sm" data-access-approve="${item.id}">
            <i class="ri-check-line"></i> Approve
          </button>
          <button type="button" class="pa-btn pa-btn-cancel pa-btn-sm" data-access-reject="${item.id}">
            <i class="ri-close-line"></i> Reject
          </button>
        </div>` : `<div class="pa-text-mute fs-sm">Reviewed ${formatDateTime(item.reviewedAt)}</div>`;
    return `<article class="pa-access-request-card" data-request-id="${item.id}">
      <div class="pa-access-request-head">
        <div>
          <div class="pa-access-request-title">${name}</div>
          <div class="pa-text-mute fs-sm">${role} \xB7 ${contact}</div>
        </div>
        ${statusBadge(item.status)}
      </div>
      <p class="pa-access-request-message">${message}</p>
      <div class="pa-access-request-meta">
        <span>Submitted ${formatDateTime(item.createdAt)}</span>
        ${item.durationHours ? `<span>Duration: ${item.durationHours}h</span>` : ""}
        ${item.elevatedUntil ? `<span>Access until ${formatDateTime(item.elevatedUntil)}</span>` : ""}
      </div>
      ${actions}
    </article>`;
  }
  bindEvents() {
    $id("paAccessRequestsRefresh")?.addEventListener("click", () => {
      void this.fetchList();
    });
    document.querySelectorAll("[data-access-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.getAttribute("data-access-filter") || "all";
        this.store.set("filter", filter);
        document.querySelectorAll("[data-access-filter]").forEach((el) => {
          const active = el.getAttribute("data-access-filter") === filter;
          el.classList.toggle("active", active);
          el.setAttribute("aria-selected", active ? "true" : "false");
        });
        this.render();
      });
    });
    const list = $id("paAccessRequestsList");
    list?.addEventListener("change", (e) => {
      const select = e.target.closest("[data-duration-select]");
      if (!select) return;
      const requestId = select.getAttribute("data-duration-select");
      const custom = list.querySelector(`[data-duration-custom="${requestId}"]`);
      if (!custom) return;
      const isCustom = select.value === "custom";
      custom.hidden = !isCustom;
      if (isCustom) custom.focus();
    });
    list?.addEventListener("click", (e) => {
      const target = e.target.closest("[data-access-approve], [data-access-reject]");
      if (!target) return;
      const id = target.getAttribute("data-access-approve") || target.getAttribute("data-access-reject");
      if (!id) return;
      if (target.hasAttribute("data-access-approve")) {
        void this.review(id, "approve");
      } else {
        void this.review(id, "reject");
      }
    });
  }
  getDurationHours(requestId) {
    const list = $id("paAccessRequestsList");
    const select = list?.querySelector(`[data-duration-select="${requestId}"]`);
    if (!select) return 3;
    if (select.value === "custom") {
      const custom = list?.querySelector(`[data-duration-custom="${requestId}"]`);
      const n = parseInt(String(custom?.value ?? ""), 10);
      if (!Number.isFinite(n) || n < 1 || n > 72) {
        throw new Error("Enter a custom duration between 1 and 72 hours.");
      }
      return n;
    }
    const preset = parseInt(select.value, 10);
    return Number.isFinite(preset) ? preset : 3;
  }
  review(id, action) {
    if (action === "approve") {
      let durationHours = 3;
      try {
        durationHours = this.getDurationHours(id);
      } catch (err) {
        showToast(err?.message || "Invalid duration.", "danger");
        return;
      }
      const hourLabel = durationHours === 1 ? "1 hour" : `${durationHours} hours`;
      requestBulkAction({
        title: "Approve temporary editor role?",
        message: `The user\u2019s role will change from <strong>viewer</strong> to <strong>editor</strong> for <strong>${hourLabel}</strong>, then revert automatically. User management stays restricted.`,
        confirmLabel: "Approve",
        danger: false,
        iconClass: "ri-check-line",
        iconTone: "warning",
        onConfirm: () => this.patchReview(id, "approve", "", durationHours)
      });
      return;
    }
    requestBulkAction({
      title: "Reject access request?",
      message: "The requester will be notified by email and in the app.",
      confirmLabel: "Reject",
      iconClass: "ri-close-circle-line",
      onConfirm: () => {
        const rejectionNote = window.prompt("Optional note for the requester:")?.trim() || "";
        void this.patchReview(id, "reject", rejectionNote);
      }
    });
  }
  async patchReview(id, action, rejectionNote, durationHours) {
    try {
      const payload = { action, rejectionNote };
      if (action === "approve" && durationHours != null) {
        payload.durationHours = durationHours;
      }
      const res = await fetch(`/api/admin/access-requests/${encodeURIComponent(id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed.");
      showToast(action === "approve" ? "Access approved." : "Request rejected.", "success");
      await this.fetchList();
    } catch (err) {
      showToast(err?.message || "Could not update request.", "danger");
    }
  }
};
export {
  AccessRequestsModule
};
//# sourceMappingURL=AccessRequestsModule-YQGN4EYG.js.map
