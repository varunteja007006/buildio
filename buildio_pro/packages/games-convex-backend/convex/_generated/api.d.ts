/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as billEdits from "../billEdits.js";
import type * as billHelpers from "../billHelpers.js";
import type * as billPayments from "../billPayments.js";
import type * as billTrash from "../billTrash.js";
import type * as bills from "../bills.js";
import type * as chat from "../chat.js";
import type * as cleanup from "../cleanup.js";
import type * as crons from "../crons.js";
import type * as lib_billMath from "../lib/billMath.js";
import type * as presence from "../presence.js";
import type * as rooms from "../rooms.js";
import type * as scribble from "../scribble.js";
import type * as stories from "../stories.js";
import type * as storyPoints from "../storyPoints.js";
import type * as user from "../user.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  billEdits: typeof billEdits;
  billHelpers: typeof billHelpers;
  billPayments: typeof billPayments;
  billTrash: typeof billTrash;
  bills: typeof bills;
  chat: typeof chat;
  cleanup: typeof cleanup;
  crons: typeof crons;
  "lib/billMath": typeof lib_billMath;
  presence: typeof presence;
  rooms: typeof rooms;
  scribble: typeof scribble;
  stories: typeof stories;
  storyPoints: typeof storyPoints;
  user: typeof user;
  utils: typeof utils;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  presence: import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
};
