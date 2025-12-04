import { useEffect, useMemo, useState } from 'react';
import { MediaPlayer, useMediaPlayer, useMediaState } from '@web-loom/media-react';
import { minimalControlsPlugin } from '@web-loom/media-core';
import '../examples.css';
import demoVideo from '../../../assets/demo-video.mp4';
import demoPoster from '../../../assets/demo-poster.png';
import captionsEn from '../../../assets/demo-captions-en.vtt';
import captionsEs from '../../../assets/demo-captions-es.vtt';

const QUALITY_PRESETS = [
  {
    id: 'hd',
    label: 'MP4 1080p (5 Mbps)',
    width: 1920,
    height: 1080,
    bitrate: 5000,
    description: 'High definition feed for broadband connections.',
    src: demoVideo,
    type: 'video/mp4',
  },
  {
    id: 'sd',
    label: 'MP4 480p (1.5 Mbps)',
    width: 854,
    height: 480,
    bitrate: 1500,
    description: 'Bandwidth-friendly fallback rendition.',
    src: demoVideo,
    type: 'video/mp4',
  },
];

const CAPTION_TRACKS = [
  {
    id: 'captions-en',
    kind: 'subtitles' as const,
    label: 'English',
    srclang: 'en',
    src: captionsEn,
    default: true,
  },
  {
    id: 'captions-es',
    kind: 'subtitles' as const,
    label: 'Spanish',
    srclang: 'es',
    src: captionsEs,
  },
];

const CHAPTERS = [
  { id: 'intro', title: 'Introduction', startTime: 0, endTime: 16 },
  { id: 'core', title: 'Core Concepts', startTime: 16, endTime: 42 },
  { id: 'recap', title: 'Recap & Next Steps', startTime: 42 },
];

const PLAYBACK_RATES = [0.5, 1, 1.25, 1.5, 2];
const SEEK_INCREMENT = 10;

export function MediaReactExample(): JSX.Element {
  const [selectedQuality, setSelectedQuality] = useState(QUALITY_PRESETS[0].id);
  const [captionSelection, setCaptionSelection] = useState<string>(CAPTION_TRACKS[0].id);
  const [autoplayMode, setAutoplayMode] = useState<'off' | 'muted' | 'on'>('off');
  const [loopPlayback, setLoopPlayback] = useState(false);
  const [useNativeControls, setUseNativeControls] = useState(false);
  const playerPlugins = useMemo(() => [minimalControlsPlugin], []);

  const config = useMemo(
    () => ({
      kind: 'video' as const,
      sources: QUALITY_PRESETS.map((preset) => ({
        src: preset.src,
        type: preset.type,
        label: preset.label,
        width: preset.width,
        height: preset.height,
        bitrate: preset.bitrate,
        meta: { description: preset.description },
        isDefault: preset.id === selectedQuality,
      })),
      poster: demoPoster,
      tracks: CAPTION_TRACKS,
      chapters: CHAPTERS,
    }),
    [selectedQuality]
  );

  const playerOptions = useMemo(
    () => ({
      controls: useNativeControls,
      preload: 'metadata' as const,
      playsInline: true,
      responsive: true,
      aspectRatio: '16 / 9',
      loop: loopPlayback,
      autoplay: autoplayMode === 'off' ? false : autoplayMode === 'muted' ? 'muted' : true,
      defaultTextTrackId: 'captions-en',
    }),
    [useNativeControls, loopPlayback, autoplayMode]
  );

  const { containerRef, player } = useMediaPlayer(config, playerOptions, { plugins: playerPlugins });
  const snapshot = useMediaState(player);

  useEffect(() => {
    if (!player) return;
    if (captionSelection === 'off') {
      player.setCaptionTrack(null);
      return;
    }
    player.setCaptionTrack(captionSelection);
  }, [captionSelection, player]);

  const canUsePiP = player?.isPictureInPictureSupported() ?? false;
  const isPlaying = snapshot?.state === 'playing';
  const volume = snapshot?.volume ?? 1;
  const playbackRate = snapshot?.playbackRate ?? 1;

  const handleSeek = (delta: number) => {
    if (!player) return;
    const duration = player.getDuration() ?? 0;
    const nextTime = Math.min(Math.max(player.getCurrentTime() + delta, 0), duration || Number.POSITIVE_INFINITY);
    player.seekTo(nextTime);
  };

  return (
    <section className="example-container">
      <h2>Media React – Declarative Component</h2>
      <p>
        Demonstrates how <code>@web-loom/media-react</code> composes the declarative <code>&lt;MediaPlayer /&gt;</code> component
        with hooks for custom layouts, source selection, captions, playback controls, and MediaCore plugin integration.
      </p>

      <div className="example-controls" style={{ flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '180px' }}>
          <label htmlFor="media-quality">Source / Quality</label>
          <select
            id="media-quality"
            value={selectedQuality}
            onChange={(event) => setSelectedQuality(event.target.value)}
          >
            {QUALITY_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px' }}>
          <label htmlFor="media-captions">Subtitles</label>
          <select
            id="media-captions"
            value={captionSelection}
            onChange={(event) => setCaptionSelection(event.target.value)}
          >
            {CAPTION_TRACKS.map((track) => (
              <option key={track.id} value={track.id}>
                {track.label}
              </option>
            ))}
            <option value="off">Off</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px' }}>
          <label htmlFor="media-playback-rate">Playback Rate</label>
          <select
            id="media-playback-rate"
            value={playbackRate.toString()}
            onChange={(event) => player?.setPlaybackRate(Number(event.target.value))}
          >
            {PLAYBACK_RATES.map((rate) => (
              <option key={rate} value={rate.toString()}>
                {rate}x
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px' }}>
          <label htmlFor="media-autoplay">Autoplay</label>
          <select
            id="media-autoplay"
            value={autoplayMode}
            onChange={(event) => setAutoplayMode(event.target.value as 'off' | 'muted' | 'on')}
          >
            <option value="off">Disabled</option>
            <option value="muted">Muted</option>
            <option value="on">Enabled</option>
          </select>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={loopPlayback}
            onChange={(event) => setLoopPlayback(event.target.checked)}
          />
          Loop playback
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={useNativeControls}
            onChange={(event) => setUseNativeControls(event.target.checked)}
          />
          Show native controls
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '220px' }}>
          <label htmlFor="media-volume">Volume</label>
          <input
            id="media-volume"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(event) => player?.setVolume(Number(event.target.value))}
          />
        </div>
      </div>

      <div className="media-demo">
        <div className="media-demo-card">
          <h3>MediaPlayer Component</h3>
          <MediaPlayer
            config={config}
            options={playerOptions}
            plugins={playerPlugins}
            className="media-demo-player"
            data-testid="media-react-player"
          />
        </div>

        <div className="media-demo-card">
          <h3>Hook-driven Layout</h3>
          <div ref={containerRef} className="media-demo-player" />
          <div className="example-controls" style={{ marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => player?.togglePlayPause()} disabled={!player}>
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button className="btn btn-secondary" onClick={() => handleSeek(-SEEK_INCREMENT)} disabled={!player}>
              -{SEEK_INCREMENT}s
            </button>
            <button className="btn btn-secondary" onClick={() => handleSeek(SEEK_INCREMENT)} disabled={!player}>
              +{SEEK_INCREMENT}s
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => player?.setMuted(!(snapshot?.muted ?? false))}
              disabled={!player}
            >
              {snapshot?.muted ? 'Unmute' : 'Mute'}
            </button>
            <button className="btn btn-secondary" onClick={() => player?.reload()} disabled={!player}>
              Reload Source
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => player && player.enterPictureInPicture()}
              disabled={!canUsePiP}
            >
              Picture-in-Picture
            </button>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#444' }}>
            <strong>Chapters:</strong>
            <ol style={{ marginTop: '0.25rem', paddingLeft: '1.25rem' }}>
              {CHAPTERS.map((chapter) => (
                <li key={chapter.id}>
                  {chapter.title} ({chapter.startTime}s{chapter.endTime ? ` – ${chapter.endTime}s` : ' → end'})
                </li>
              ))}
            </ol>
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
