import type { PluginManifest } from '@repo/plugin-core';

interface Props {
  plugin: PluginManifest;
}

export function PluginSpotlight({ plugin }: Props) {
  return (
    <article className="plugin-spotlight">
      <header>
        <div>
          <p className="plugin-spotlight__meta">{plugin.id}</p>
          <h3>{plugin.name}</h3>
        </div>
        <span className="plugin-spotlight__version">v{plugin.version}</span>
      </header>
      <p className="plugin-spotlight__description">{plugin.description ?? 'No description provided yet.'}</p>
      <div className="plugin-spotlight__footer">
        <span>{plugin.widgets?.length ?? 0} widgets</span>
        <span>{plugin.menuItems?.length ?? 0} menu hooks</span>
      </div>
    </article>
  );
}
