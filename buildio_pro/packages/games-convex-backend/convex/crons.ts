import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "clear staled stories",
  { minutes: 60 }, // every 60 minutes
  internal.cleanup.deleteStaleStories,
);

crons.interval(
  "clear stories and points",
  { minutes: 30240 }, // every 3 weeks (21 days)
  internal.cleanup.clearStoriesAndPoints,
);

crons.interval(
  "prune old chats",
  { minutes: 60 }, // every hour
  internal.cleanup.deleteOldChats,
);

crons.interval(
  "prune old scribble canvases",
  { minutes: 60 }, // every hour
  internal.cleanup.deleteOldScribbleLines,
);

crons.interval(
  "prune old team reactions",
  { minutes: 60 }, // every hour
  internal.cleanup.deleteOldTeamReactions,
);

crons.interval(
  "prune old secret santa data",
  { hours: 24 },
  internal.cleanup.deleteOldSantaData,
);

crons.interval(
  "delete bill groups after six months",
  { hours: 24 },
  internal.billRetention.deleteExpiredGroups,
  {},
);

export default crons;
