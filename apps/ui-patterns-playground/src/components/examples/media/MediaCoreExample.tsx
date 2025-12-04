import { useEffect, useRef, useState } from 'react';
import type { PlaybackSnapshot } from '@web-loom/media-core';
import { MediaCorePlayer, minimalControlsPlugin } from '@web-loom/media-core';
import '../examples.css';
import demoVideo from '../../../assets/demo-video.mp4';
import demoPoster from '../../../assets/demo-poster.png';

export function MediaCoreExample(): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<MediaCorePlayer | null>(null);
  const [snapshot, setSnapshot] = useState<PlaybackSnapshot | null>(null);

  useEffect(() => {
    const player = new MediaCorePlayer(
      {
        kind: 'video',
        sources: [
          {
            src: demoVideo,
            type: 'video/mp4',
            label: 'MP4',
          },
        ],
        poster: demoPoster,
      },
      { controls: false, autoplay: false },
    );
    playerRef.current = player;

    const mountTarget = containerRef.current;
    if (mountTarget) {
      player.mount(mountTarget);
      player.use(minimalControlsPlugin, { showTime: true });
    }

    const disposers = [
      player.on('ready', setSnapshot),
      player.on('play', setSnapshot),
      player.on('pause', setSnapshot),
      player.on('timeupdate', setSnapshot),
      player.on('error', setSnapshot),
    ];

    return () => {
      disposers.forEach((dispose) => dispose());
      player.dispose();
      playerRef.current = null;
    };
  }, [demoVideo, demoPoster]);

  return (
    <section className="example-container">
      <h2>MediaCore – Vanilla Usage</h2>
      <p>
        Directly mounts a <code>MediaCorePlayer</code> instance and attaches the minimal controls plugin. Replace the{' '}
        <code>src/assets</code> media files with your own content.
      </p>

      <div className="media-demo">
        <div className="media-demo-card">
          <h3>Video Player</h3>
          <div className="media-demo-player" ref={containerRef} />
        </div>
      </div>

      <div className="example-state">
        <h3>Playback Snapshot</h3>
        <pre>{JSON.stringify(snapshot, null, 2)}</pre>
      </div>
    </section>
  );
}
