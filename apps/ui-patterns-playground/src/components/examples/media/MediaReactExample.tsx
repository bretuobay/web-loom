import { MediaPlayer, useMediaPlayer, useMediaState } from '@web-loom/media-react';
import '../examples.css';
import demoVideo from '../../../assets/demo-video.mp4';
import demoPoster from '../../../assets/demo-poster.png';

export function MediaReactExample(): JSX.Element {
  const config = {
    kind: 'video' as const,
    sources: [
      {
        src: demoVideo,
        type: 'video/mp4',
        label: 'MP4',
      },
    ],
    poster: demoPoster,
  };

  const { containerRef, player } = useMediaPlayer(config);
  const snapshot = useMediaState(player);

  return (
    <section className="example-container">
      <h2>Media React – Declarative Component</h2>
      <p>
        Uses the <code>&lt;MediaPlayer /&gt;</code> component and hooks from <code>@web-loom/media-react</code>.
        Customize the hooks to build richer UIs around the core player state.
      </p>

      <div className="media-demo">
        <div className="media-demo-card">
          <h3>MediaPlayer Component</h3>
          <MediaPlayer config={config} className="media-demo-player" data-testid="media-react-player" />
        </div>

        <div className="media-demo-card">
          <h3>Hook-driven Layout</h3>
          <div ref={containerRef} className="media-demo-player" />
          <div style={{ marginTop: '0.75rem' }}>
            <button className="btn btn-primary" onClick={() => player?.togglePlayPause()}>
              Toggle Play/Pause
            </button>
          </div>
        </div>
      </div>

      <div className="example-state">
        <h3>Playback Snapshot</h3>
        <pre>{JSON.stringify(snapshot, null, 2)}</pre>
      </div>
    </section>
  );
}
