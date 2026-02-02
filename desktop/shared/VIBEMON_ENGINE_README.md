# VibeMon Engine

Vibe Monitor 캐릭터 렌더링 엔진. `vibemon-engine-standalone.js` 하나로 모든 렌더링 가능.

**CSS 포함** - 별도 CSS 파일 불필요.
**HTML 자동 생성** - 빈 컨테이너만 있으면 내부 요소 자동 생성.

## 사용법

### 1. HTML 구조

```html
<div class="vibemon-display" id="vibemon-display"></div>
```

### 2. 초기화

```javascript
import { createVibeMonEngine } from './vibemon-engine-standalone.js';

const container = document.getElementById('vibemon-display');
const engine = createVibeMonEngine(container, { useEmoji: true });
await engine.init();  // CSS 자동 주입, 내부 HTML 자동 생성
engine.startAnimation();
```

### 3. 상태 업데이트

```javascript
engine.setState({
  state: 'working',
  character: 'clawd',
  project: 'my-project',
  tool: 'Bash',
  model: 'opus',
  memory: 75
});
engine.render();
```

### 4. 종료

```javascript
engine.cleanup();
```

## 상태 (States)

| State | Color | Effect |
|-------|-------|--------|
| `start` | Cyan | Sparkle |
| `idle` | Green | Blinking |
| `thinking` | Purple | Thinking bubble |
| `planning` | Teal | Thinking bubble |
| `working` | Blue | Sparkle + Sunglasses |
| `packing` | Gray | Thinking bubble |
| `notification` | Yellow | Question mark |
| `done` | Green | Happy eyes |
| `sleep` | Navy | Zzz |

## 캐릭터 (Characters)

| Character | Color |
|-----------|-------|
| `clawd` | Orange (default) |
| `kiro` | White |
| `claw` | Red |

## 텍스트 (Working Tool)

| Tool | Text |
|------|------|
| `bash` | Running |
| `read` | Reading |
| `edit` | Editing |
| `write` | Writing |
| `grep` | Searching |
| `glob` | Scanning |
| `task` | Working |
| `webfetch` | Fetching |
| `websearch` | Searching |
| default | Working |

## 캐릭터 이미지

기본적으로 `https://static.vibemon.io/characters/`에서 로드됨.

커스텀 이미지 사용:
```javascript
const engine = createVibeMonEngine(container, {
  characterImageUrls: {
    clawd: './images/clawd.png',
    kiro: './images/kiro.png',
    claw: './images/claw.png'
  }
});
```

## 옵션

| Option | Default | Description |
|--------|---------|-------------|
| `useEmoji` | false | 아이콘에 이모지 사용 |
| `characterImageUrls` | (static server) | 캐릭터 이미지 경로 |

## CSS 클래스 (vibemon- prefix)

모든 클래스는 `vibemon-` prefix 사용:
- `.vibemon-display`
- `.vibemon-canvas`
- `.vibemon-status-text`
- `.vibemon-loading-dots`
- `.vibemon-dot`
- `.vibemon-info-text`
- `.vibemon-project-text`, `.vibemon-tool-text`, `.vibemon-model-text`, `.vibemon-memory-text`
- `.vibemon-info-label`, `.vibemon-info-value`
- `.vibemon-memory-bar-container`, `.vibemon-memory-bar`
- `.vibemon-emoji-icon`, `.vibemon-pixel-icon`
