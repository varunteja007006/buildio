export interface RecentGroup {
  groupId: string;
  name: string;
  visitedAt: number;
  expiresAt: number;
}

const KEY = "billezy.recent-groups.v1";
const LIMIT = 50;

export function readRecentGroups(): RecentGroup[] {
  try {
    const data: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(data)) return [];
    const seen = new Set<string>();
    return data
      .filter((item): item is RecentGroup => {
        if (!item || typeof item !== "object") return false;
        const valid =
          typeof item.groupId === "string" &&
          /^[a-z0-9]{1,128}$/i.test(item.groupId) &&
          typeof item.name === "string" &&
          typeof item.visitedAt === "number" &&
          Number.isFinite(item.visitedAt) &&
          typeof item.expiresAt === "number" &&
          Number.isFinite(item.expiresAt);
        if (!valid || seen.has(item.groupId)) return false;
        seen.add(item.groupId);
        return true;
      })
      .sort((a, b) => b.visitedAt - a.visitedAt)
      .slice(0, LIMIT);
  } catch {
    return [];
  }
}

export function rememberGroup(group: Omit<RecentGroup, "visitedAt">): void {
  try {
    const groups = readRecentGroups().filter(
      (item) => item.groupId !== group.groupId,
    );
    groups.unshift({ ...group, visitedAt: Date.now() });
    window.localStorage.setItem(KEY, JSON.stringify(groups.slice(0, LIMIT)));
  } catch {
    // Browsers can block storage or run out of quota; bills must still work.
  }
}

export function forgetGroup(groupId: string): void {
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify(
        readRecentGroups().filter((group) => group.groupId !== groupId),
      ),
    );
  } catch {
    // History is optional when browser storage is unavailable.
  }
}
