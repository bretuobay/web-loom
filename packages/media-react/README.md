## @web-loom/media-react

React bindings for [`@web-loom/media-core`](../media-core). The adapter exposes a declarative `<MediaPlayer />` component plus hooks for lower level integrations.

### Installation

```bash
npm install @web-loom/media-react @web-loom/media-core react react-dom
```

### Usage

```tsx
import { MediaPlayer, useMediaPlayer, useMediaState } from '@web-loom/media-react';

const config = {
  kind: 'video',
  sources: [{ src: '/clip.mp4', type: 'video/mp4' }],
};

export function PlayerExample() {
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
