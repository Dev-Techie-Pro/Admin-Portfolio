/**
 * Apply optimistic local state, persist via API, rollback on failure.
 */
export async function optimisticSave<T>({
  apply,
  rollback,
  persist,
}: {
  apply: () => void;
  rollback: () => void;
  persist: () => Promise<void>;
}): Promise<void> {
  apply();
  try {
    await persist();
  } catch (err) {
    rollback();
    throw err;
  }
}
