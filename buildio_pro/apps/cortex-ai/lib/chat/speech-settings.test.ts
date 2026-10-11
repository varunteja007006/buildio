import assert from "node:assert/strict";

import { DEFAULT_SPEECH_SETTINGS, isSpeechSettings } from "./speech-settings";

assert.equal(isSpeechSettings(DEFAULT_SPEECH_SETTINGS), true);
assert.equal(isSpeechSettings({ ...DEFAULT_SPEECH_SETTINGS, rate: 0.5 }), true);
assert.equal(
  isSpeechSettings({ ...DEFAULT_SPEECH_SETTINGS, rate: 2.1 }),
  false,
);
assert.equal(
  isSpeechSettings({ ...DEFAULT_SPEECH_SETTINGS, volume: -0.1 }),
  false,
);
assert.equal(
  isSpeechSettings({ ...DEFAULT_SPEECH_SETTINGS, pitch: Infinity }),
  false,
);
