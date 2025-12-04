## @web-loom/media-core

`@web-loom/media-core` is a framework-agnostic media engine that mounts native `<video>`, `<audio>`, or `<img>` elements and exposes a typed plugin and event system.

### Vanilla usage

```ts
import { MediaCorePlayer } from '@web-loom/media-core';

const player = new MediaCorePlayer({
  kind: 'video',
  sources: [
    { src: '/clip-720p.mp4', type: 'video/mp4', label: '720p' },
    { src: '/clip-480p.webm', type: 'video/webm', label: '480p' },
  ],
});

player.mount('#player-container');
player.onReady(() => {
  void player.play();
});
```

### React adapter

Install [`@web-loom/media-react`](../media-react) for a declarative component and hooks:

```tsx
import { MediaPlayer, useMediaPlayer, useMediaState } from '@web-loom/media-react';

const config = {
  kind: 'video',
  sources: [{ src: '/clip.mp4', type: 'video/mp4' }],
};

export function Player() {
  return <MediaPlayer config={config} />;
}

export function CustomLayout() {
  const { containerRef, player } = useMediaPlayer(config);
  const snapshot = useMediaState(player);

  return (
    <div>
      <div ref={containerRef} />
      <div>{snapshot?.state}</div>
    </div>
  );
}
```

### Vue adapter

Install [`@web-loom/media-vue`](../media-vue) for Vue 3 components and composables:

```vue
<script setup lang="ts">
import { MediaPlayer, useMediaPlayer, useMediaState } from '@web-loom/media-vue';

const config = {
  kind: 'video' as const,
  sources: [{ src: '/clip.mp4', type: 'video/mp4' }],
};

const { containerRef, player } = useMediaPlayer(config);
const snapshot = useMediaState(player);
</script>

<template>
  <MediaPlayer :config="config" />
  <div ref="containerRef" />
  <div>{{ snapshot?.state }}</div>
</template>
```
