import { storage } from "../core/StorageService.js";
import { defaultTechnologyCategoryId, loadToolCategories } from "./technologyCategorySelect.js";
async function resolveToolByName(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return null;
  storage.invalidate("pa_tools");
  let tools = await storage.get("pa_tools", []);
  if (!Array.isArray(tools)) tools = [];
  const hit = tools.find((t) => String(t.name || "").toLowerCase() === trimmed.toLowerCase());
  if (hit) return hit;
  const categories = await loadToolCategories();
  const defaultCat = defaultTechnologyCategoryId(categories);
  if (defaultCat == null) return null;
  const newId = Math.max(0, ...tools.map((t) => Number(t.id) || 0)) + 1;
  const newTool = {
    id: newId,
    name: trimmed,
    categoryId: defaultCat,
    iconClass: "ri-checkbox-blank-circle-line",
    iconUrl: "",
    sortOrder: newId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await storage.set("pa_tools", tools.concat(newTool));
  storage.invalidate("pa_recent_activities");
  return newTool;
}
export {
  resolveToolByName
};
