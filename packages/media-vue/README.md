## @web-loom/media-vue

Vue 3 bindings for [`@web-loom/media-core`](../media-core).

### Installation

```bash
npm install @web-loom/media-vue @web-loom/media-core vue
```

### Usage

```ts
<script setup lang="ts">
import { MediaPlayer, useMediaPlayer, useMediaState } from '@web-loom/media-vue';

const config = {
  kind: 'video' as const,
  sources: [{ src: '/clip.mp4', type: 'video/mp4' }],
};
</script>

<template>
  <MediaPlayer :config="config" />
</template>
```

You can opt into the composables directly for custom layouts:

```ts
<script setup lang="ts">
const { containerRef, player } = useMediaPlayer(config);
const snapshot = useMediaState(player);
</script>

<template>
  <div ref="containerRef" />
  <div>{{ snapshot?.state }}</div>
</template>
```
