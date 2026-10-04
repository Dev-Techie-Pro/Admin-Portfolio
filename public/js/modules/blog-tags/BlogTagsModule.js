import { DEFAULT_TAG_ENTITY_LABELS, TagsModule } from "../tags/TagsModule.js";
import { storage } from "../../core/StorageService.js";
const BLOG_TAG_ENTITY_LABELS = {
  ...DEFAULT_TAG_ENTITY_LABELS,
  capitalized: "Post",
  pluralCapitalized: "Posts",
  selectPlaceholder: "Select a post",
  selectError: "Please select a post",
  filterAll: "All Posts",
  filterAria: "Filter by post",
  assignHint: "assign this tag to a post",
  tagNameHint: "shown on blog posts",
  fallbackName: "Post",
  listColumn: "Post",
  noLinked: "No posts linked",
  notLinkedDelete: "Not linked to any posts yet.",
  emptyTitle: "No blog tags yet",
  emptyText: "Get started by adding your first blog tag.",
  navigatePath: "/blog-post",
  focusStorageKey: "pa_blog_posts_focus_id",
  deleteConfirmTitle: "Delete blog tag?",
  deleteConfirmText: "This will permanently remove the tag from the assigned post.",
  addPanelBlockedToast: "Add a blog post first before creating tags.",
  viewAria: "View post"
};
class BlogTagsModule extends TagsModule {
  constructor() {
    super();
    this.posts = [];
    this.config.name = "Blog Tags";
    this.config.storageKey = "pa_blog_tags";
    this.storageKey = "pa_blog_tags";
    this.config.page = "blog-tags";
    this.config.deleteType = "blog-tag";
    this.entityLabels = BLOG_TAG_ENTITY_LABELS;
    this.posts = [];
  }
  async load() {
    const [records, posts] = await Promise.all([
      storage.revalidate(this.storageKey, []),
      storage.revalidate("pa_blog_posts", [])
    ]);
    this.posts = Array.isArray(posts) ? posts.slice() : [];
    const mapped = (Array.isArray(records) ? records : []).map((r) => ({
      ...r,
      projectLegacyIds: r.postLegacyIds || [],
      projectTitles: r.postTitles || [],
      projectCount: r.postCount ?? (r.postLegacyIds || []).length
    }));
    this.projects = this.posts.map((p) => ({ id: p.id, title: p.title }));
    this.store.set("records", mapped);
    this.patchEntityLabels();
    this.populateProjectSelects();
  }
  async persist() {
    const mapped = this.store.get("records").map((r) => ({
      id: r.id,
      uuid: r.uuid,
      name: r.name || r.tag,
      slug: r.slug,
      desc: r.desc,
      postLegacyIds: r.projectLegacyIds || r.postLegacyIds || [],
      postTitles: r.projectTitles || r.postTitles || [],
      postCount: r.projectCount,
      createdAt: r.createdAt
    }));
    await this.saveRecords(mapped);
    storage.invalidate(this.storageKey);
    storage.invalidate("pa_blog_posts");
    const fresh = await storage.revalidate(this.storageKey, []);
    this.store.set("records", (fresh || []).map((r) => ({
      ...r,
      projectLegacyIds: r.postLegacyIds || [],
      projectTitles: r.postTitles || [],
      projectCount: r.postCount ?? (r.postLegacyIds || []).length
    })));
  }
  openAddPanel() {
    if (!this.posts.length) {
      this.toast(this.getEntityLabels().addPanelBlockedToast, "danger");
      return;
    }
    super.openAddPanel();
  }
}
export {
  BlogTagsModule
};
