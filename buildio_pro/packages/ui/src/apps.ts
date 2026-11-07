export type BuildioApp = {
  slug: string;
  name: string;
  url: string;
  emoji?: string;
  note?: string; // e.g. "Android", "source"
  description?: string;
};

export const BUILDIO_APPS: BuildioApp[] = [
  {
    slug: "web",
    name: "Buildio.pro",
    url: "https://buildio.pro",
    emoji: "🏗️",
    description: "Small tools, big fun — everything I ship lives here.",
  },
  {
    slug: "poker-planner",
    name: "Poker Planner",
    url: "https://poker-planner.buildio.pro",
    emoji: "🃏",
    description: "Realtime planning poker for agile teams",
  },
  {
    // Temporary URL, custom domain pending.
    slug: "housie-game",
    name: "Housie",
    url: "https://housie-picker.netlify.app",
    emoji: "🎱",
    description: "Tambola number caller for game night",
  },
  {
    slug: "secret-santa",
    name: "Secret Santa",
    url: "https://secret-santa.buildio.pro",
    emoji: "🎅",
    description: "Gift exchange rooms with wishlists",
  },
  {
    slug: "billezy",
    name: "Billezy",
    url: "https://billezy.buildio.pro",
    emoji: "💸",
    description: "Split bills with friends, fairly",
  },
  {
    slug: "scribble",
    name: "Scribble",
    url: "https://github.com/varunteja007006/buildio/tree/main/buildio_pro/apps/scribble",
    emoji: "🎨",
    note: "source",
    description: "Draw and guess together in realtime",
  },
  {
    slug: "book",
    name: "Book",
    url: "https://github.com/varunteja007006/buildio/tree/main/buildio_pro/apps/book",
    emoji: "📖",
    note: "source",
    description: "Track your reading and capture notes",
  },
  {
    slug: "cortex-ai",
    name: "Cortex",
    url: "https://github.com/varunteja007006/buildio/tree/main/buildio_pro/apps/cortex-ai",
    emoji: "🧠",
    note: "source",
    description: "AI chat with your documents",
  },
  {
    slug: "expense-tracker",
    name: "Expense Tracker",
    url: "https://github.com/varunteja007006/buildio/tree/main/buildio_pro/apps/expense-tracker",
    emoji: "🧾",
    note: "source",
    description: "Expenses, budgets and insights",
  },
  // Uncomment to list the Eggsy Android app in footers.
  // {
  //   slug: "eggsy",
  //   name: "Eggsy",
  //   url: "https://github.com/varunteja007006/buildio/tree/main/buildio_pro/apps/eggsy",
  //   emoji: "🥚",
  //   note: "Android",
  //   description: "Egg-citing kitchen companion app",
  // },
];
