/**
 * Input validation functions for the Vibe Monitor
 */

const { VALID_STATES, CHARACTER_NAMES } = require('../shared/config.cjs');

// Validation limits
const PROJECT_MAX_LENGTH = 100;
const TOOL_MAX_LENGTH = 50;
const MODEL_MAX_LENGTH = 50;
const EVENT_MAX_LENGTH = 50;
const MEMORY_PATTERN = /^(100|[1-9]?\d)%$/;  // 0-100 only

/**
 * Validate state value
 * @param {string} state
 * @returns {{valid: boolean, error: string|null}}
 */
function validateState(state) {
  if (state === undefined) {
    return { valid: true, error: null };
  }
  if (!VALID_STATES.includes(state)) {
    return { valid: false, error: `Invalid state: ${state}. Valid states: ${VALID_STATES.join(', ')}` };
  }
  return { valid: true, error: null };
}

/**
 * Validate character value
 * @param {string} character
 * @returns {{valid: boolean, error: string|null}}
 */
function validateCharacter(character) {
  if (character === undefined) {
    return { valid: true, error: null };
  }
  if (!CHARACTER_NAMES.includes(character)) {
    return { valid: false, error: `Invalid character: ${character}. Valid characters: ${CHARACTER_NAMES.join(', ')}` };
  }
  return { valid: true, error: null };
}

/**
 * Validate project name
 * @param {string} project
 * @returns {{valid: boolean, error: string|null}}
 */
function validateProject(project) {
  if (project === undefined) {
    return { valid: true, error: null };
  }
  if (typeof project !== 'string') {
    return { valid: false, error: 'Project must be a string' };
  }
  if (project.length > PROJECT_MAX_LENGTH) {
    return { valid: false, error: `Project name exceeds ${PROJECT_MAX_LENGTH} characters` };
  }
  return { valid: true, error: null };
}

/**
 * Validate memory value (format: "N%" where N is 0-100)
 * @param {string} memory
 * @returns {{valid: boolean, error: string|null}}
 */
function validateMemory(memory) {
  if (memory === undefined || memory === '') {
    return { valid: true, error: null };
  }
  if (typeof memory !== 'string') {
    return { valid: false, error: 'Memory must be a string' };
  }
  if (!MEMORY_PATTERN.test(memory)) {
    return { valid: false, error: 'Memory must be in format "N%" where N is 0-100' };
  }
  return { valid: true, error: null };
}

/**
 * Validate tool name
 * @param {string} tool
 * @returns {{valid: boolean, error: string|null}}
 */
function validateTool(tool) {
  if (tool === undefined || tool === '') {
    return { valid: true, error: null };
  }
  if (typeof tool !== 'string') {
    return { valid: false, error: 'Tool must be a string' };
  }
  if (tool.length > TOOL_MAX_LENGTH) {
    return { valid: false, error: `Tool name exceeds ${TOOL_MAX_LENGTH} characters` };
  }
  return { valid: true, error: null };
}

/**
 * Validate model name
 * @param {string} model
 * @returns {{valid: boolean, error: string|null}}
 */
function validateModel(model) {
  if (model === undefined || model === '') {
    return { valid: true, error: null };
  }
  if (typeof model !== 'string') {
    return { valid: false, error: 'Model must be a string' };
  }
  if (model.length > MODEL_MAX_LENGTH) {
    return { valid: false, error: `Model name exceeds ${MODEL_MAX_LENGTH} characters` };
  }
  return { valid: true, error: null };
}

/**
 * Validate event name
 * @param {string} event
 * @returns {{valid: boolean, error: string|null}}
 */
function validateEvent(event) {
  if (event === undefined || event === '') {
    return { valid: true, error: null };
  }
  if (typeof event !== 'string') {
    return { valid: false, error: 'Event must be a string' };
  }
  if (event.length > EVENT_MAX_LENGTH) {
    return { valid: false, error: `Event name exceeds ${EVENT_MAX_LENGTH} characters` };
  }
  return { valid: true, error: null };
}

/**
 * Validate status payload
 * @param {object} data
 * @returns {{valid: boolean, error: string|null}}
 */
function validateStatusPayload(data) {
  const stateResult = validateState(data.state);
  if (!stateResult.valid) return stateResult;

  const characterResult = validateCharacter(data.character);
  if (!characterResult.valid) return characterResult;

  const projectResult = validateProject(data.project);
  if (!projectResult.valid) return projectResult;

  const memoryResult = validateMemory(data.memory);
  if (!memoryResult.valid) return memoryResult;

  const toolResult = validateTool(data.tool);
  if (!toolResult.valid) return toolResult;

  const modelResult = validateModel(data.model);
  if (!modelResult.valid) return modelResult;

  const eventResult = validateEvent(data.event);
  if (!eventResult.valid) return eventResult;

  return { valid: true, error: null };
}

module.exports = {
  validateState,
  validateCharacter,
  validateProject,
  validateMemory,
  validateTool,
  validateModel,
  validateEvent,
  validateStatusPayload
};
