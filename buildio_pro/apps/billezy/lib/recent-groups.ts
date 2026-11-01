export interface RecentGroup {
  groupId: string;
  name: string;
}

// Key stays at "v1": legacy entries may carry extra fields that are ignored on
// read and dropped on the next write. Array order is the recency order, with
// the newest entry first.
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
          typeof item.name === "string";
        if (!valid || seen.has(item.groupId)) return false;
        seen.add(item.groupId);
        return true;
      })
      .map(({ groupId, name }) => ({ groupId, name }))
      .slice(0, LIMIT);
  } catch {
    return [];
  }
}

export function rememberGroup(group: RecentGroup): void {
  try {
    const groups = readRecentGroups().filter(
      (item) => item.groupId !== group.groupId,
    );
    groups.unshift({ groupId: group.groupId, name: group.name });
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
