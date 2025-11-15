export type SyncPayload = {
  ideas: unknown;
  habits: unknown;
  Weekly: unknown;
  Monthly: unknown;
  Yearly: unknown;
};

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || '';

export async function saveCloudData(userId: string, payload: SyncPayload): Promise<{ ok: boolean; message?: string }>{
  if (!API_BASE) return { ok: false, message: 'API is not configured' };
  try {
    const res = await fetch(`${API_BASE}/api/sync/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, data: payload })
    });
    if (!res.ok) throw new Error(await res.text());
    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Failed to sync' };
  }
}

export async function loadCloudData(userId: string): Promise<SyncPayload | null> {
  if (!API_BASE) return null;
  const res = await fetch(`${API_BASE}/api/sync/load?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}
