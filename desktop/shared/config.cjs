/**
 * Shared configuration for Vibe Monitor (CommonJS)
 * Single source of truth: JSON files in ./data/
 */

// JSON require (CommonJS) - Single source of truth
const states = require('./data/states.json');
const characters = require('./data/characters.json');

// Derived from states (Single Source of Truth)
const VALID_STATES = Object.keys(states);
const STATE_COLORS = Object.fromEntries(
  Object.entries(states).map(([k, v]) => [k, v.bgColor])
);

// Character configuration
const CHARACTER_CONFIG = characters;
const CHARACTER_NAMES = Object.keys(characters);
const DEFAULT_CHARACTER = 'clawd';

// Colors
const COLOR_EYE = '#000000';
const COLOR_WHITE = '#FFFFFF';

// State timeouts
const IDLE_TIMEOUT = 60 * 1000;            // 1 minute (start/done -> idle)
const SLEEP_TIMEOUT = 5 * 60 * 1000;       // 5 minutes (idle -> sleep)

module.exports = {
  VALID_STATES,
  STATE_COLORS,
  CHARACTER_CONFIG,
  CHARACTER_NAMES,
  DEFAULT_CHARACTER,
  COLOR_EYE,
  COLOR_WHITE,
  IDLE_TIMEOUT,
  SLEEP_TIMEOUT
};
