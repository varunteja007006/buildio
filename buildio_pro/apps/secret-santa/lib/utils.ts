export function getEmojiForUserId(userId: string): string {
  // Simple hash function to generate a consistent emoji for a user ID.
  // see https://stackoverflow.com/a/7616484
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0; // Constrain to 32bit integer
  }
  const emojis = ["😊", "😃", "😎", "🤓", "😇", "🤖", "👻", "🐶", "🐱", "🐰"];
  return emojis[Math.abs(hash) % emojis.length] ?? "";
}
