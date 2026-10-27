// The checked-in CDC snapshot keeps the public atlas independent of database uptime.
export async function loadObservations({ loadSnapshot, loadRemote, preferRemote = false }) {
  if (preferRemote && loadRemote) {
    try {
      const rows = await loadRemote();
      if (!rows?.length) throw new Error('The remote dataset is empty.');
      return { rows, source: 'Supabase' };
    } catch {
      // Fall back to the same real CDC snapshot; never substitute synthetic values.
    }
  }
  const rows = await loadSnapshot();
  if (!rows?.length) throw new Error('The CDC snapshot is empty.');
  return { rows, source: 'Bundled CDC snapshot' };
}
