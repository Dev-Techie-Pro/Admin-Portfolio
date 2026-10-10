async function optimisticSave({
  apply,
  rollback,
  persist
}) {
  apply();
  try {
    await persist();
  } catch (err) {
    rollback();
    throw err;
  }
}
export {
  optimisticSave
};
//# sourceMappingURL=optimistic-save.js.map
