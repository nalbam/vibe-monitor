// JSON import (ES6) - Single source of truth
import states from './data/states.json' with { type: 'json' };
import characters from './data/characters.json' with { type: 'json' };
import texts from './data/texts.json' with { type: 'json' };

// State configuration export
export { states };

// Character configuration exports
export const CHARACTER_CONFIG = characters;
export const CHARACTER_NAMES = Object.keys(characters);
export const DEFAULT_CHARACTER = 'clawd';

// Text exports
export const THINKING_TEXTS = texts.thinking;
export const PLANNING_TEXTS = texts.planning;
export const TOOL_TEXTS = texts.tools;

// Character size (128x128, doubled from 64)
export const CHAR_SIZE = 128;
export const SCALE = 2;

// Colors
export const COLOR_EYE = '#000000';
export const COLOR_WHITE = '#FFFFFF';

// Floating animation constants
export const FLOAT_AMPLITUDE_X = 3;
export const FLOAT_AMPLITUDE_Y = 5;
export const CHAR_X_BASE = 22;
export const CHAR_Y_BASE = 20;

// State timeouts
export const IDLE_TIMEOUT = 60 * 1000;            // 1 minute (start/done -> idle)
export const SLEEP_TIMEOUT = 5 * 60 * 1000;       // 5 minutes (idle -> sleep)

// Animation constants
export const FRAME_INTERVAL = 100;                // 100ms per frame
export const FLOAT_CYCLE_FRAMES = 32;             // ~3.2 seconds at 100ms tick
export const LOADING_DOT_COUNT = 4;
export const THINKING_ANIMATION_SLOWDOWN = 3;     // 3x slower for thinking state
export const BLINK_START_FRAME = 30;
export const BLINK_END_FRAME = 31;

// Text truncation limits
export const PROJECT_NAME_MAX_LENGTH = 16;
export const PROJECT_NAME_TRUNCATE_AT = 13;
export const MODEL_NAME_MAX_LENGTH = 14;
export const MODEL_NAME_TRUNCATE_AT = 11;

// Matrix effect constants
export const MATRIX_STREAM_DENSITY = 0.7;         // 70% of streams visible
export const MATRIX_SPEED_MIN = 1;
export const MATRIX_SPEED_MAX = 6;
export const MATRIX_COLUMN_WIDTH = 4;
export const MATRIX_FLICKER_PERIOD = 3;
export const MATRIX_TAIL_LENGTH_FAST = 8;         // speed > 3
export const MATRIX_TAIL_LENGTH_SLOW = 6;
