/**
 * Tests for validators.cjs
 */

const {
  validateState,
  validateCharacter,
  validateProject,
  validateMemory,
  validateStatusPayload
} = require('../modules/validators.cjs');

describe('validateState', () => {
  test('accepts undefined state', () => {
    const result = validateState(undefined);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('accepts valid states', () => {
    const validStates = ['start', 'idle', 'thinking', 'planning', 'working', 'notification', 'done', 'sleep'];
    validStates.forEach(state => {
      const result = validateState(state);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  test('rejects invalid state', () => {
    const result = validateState('invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid state');
  });
});

describe('validateCharacter', () => {
  test('accepts undefined character', () => {
    const result = validateCharacter(undefined);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('accepts valid characters', () => {
    const validCharacters = ['clawd', 'kiro'];
    validCharacters.forEach(character => {
      const result = validateCharacter(character);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  test('rejects invalid character', () => {
    const result = validateCharacter('invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid character');
  });
});

describe('validateProject', () => {
  test('accepts undefined project', () => {
    const result = validateProject(undefined);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('accepts valid project name', () => {
    const result = validateProject('my-project');
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('rejects non-string project', () => {
    const result = validateProject(123);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be a string');
  });

  test('rejects too long project name', () => {
    const longName = 'a'.repeat(101);
    const result = validateProject(longName);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds');
  });
});

describe('validateMemory', () => {
  test('accepts undefined memory', () => {
    const result = validateMemory(undefined);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('accepts empty string memory', () => {
    const result = validateMemory('');
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('accepts valid memory values', () => {
    const validMemories = ['0%', '50%', '100%', '1%', '99%'];
    validMemories.forEach(memory => {
      const result = validateMemory(memory);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  test('rejects non-string memory', () => {
    const result = validateMemory(50);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be a string');
  });

  test('rejects invalid format', () => {
    const result = validateMemory('50');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('format');
  });

  test('rejects memory over 100%', () => {
    const result = validateMemory('101%');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('0-100');
  });

  test('rejects memory with leading zeros except for 0%', () => {
    // '00%' should fail as regex expects 0-100
    const result = validateMemory('00%');
    expect(result.valid).toBe(false);
  });

  test('accepts single digit memory', () => {
    const result = validateMemory('5%');
    expect(result.valid).toBe(true);
  });
});

describe('validateStatusPayload', () => {
  test('accepts valid payload', () => {
    const result = validateStatusPayload({
      state: 'thinking',
      character: 'clawd',
      project: 'my-project',
      memory: '50%'
    });
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('accepts empty payload', () => {
    const result = validateStatusPayload({});
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('rejects invalid state in payload', () => {
    const result = validateStatusPayload({
      state: 'invalid'
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid state');
  });

  test('rejects invalid character in payload', () => {
    const result = validateStatusPayload({
      character: 'invalid'
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid character');
  });

  test('rejects invalid memory in payload', () => {
    const result = validateStatusPayload({
      memory: '150%'
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('0-100');
  });
});
