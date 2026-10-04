import { storage } from "../core/StorageService.js";
async function loadStackCatalog() {
  storage.invalidate("pa_technologies");
  storage.invalidate("pa_tools");
  const [technologies, tools] = await Promise.all([
    storage.get("pa_technologies", []),
    storage.get("pa_tools", [])
  ]);
  const items = [];
  (Array.isArray(technologies) ? technologies : []).forEach((row) => {
    if (!row?.name) return;
    const id = Number(row.id);
    if (Number.isNaN(id)) return;
    items.push({ kind: "technology", id, name: String(row.name) });
  });
  (Array.isArray(tools) ? tools : []).forEach((row) => {
    if (!row?.name) return;
    const id = Number(row.id);
    if (Number.isNaN(id)) return;
    items.push({ kind: "tool", id, name: String(row.name) });
  });
  return items.sort((a, b) => a.name.localeCompare(b.name));
}
export {
  loadStackCatalog
};
