import type { PluginDefinition } from '@repo/plugin-core';
import { PluginSpotlight } from '../components/PluginSpotlight';

interface DashboardPageProps {
  pluginDefinitions: PluginDefinition[];
}

export function DashboardPage({ pluginDefinitions }: DashboardPageProps) {
  return (
    <section className="panel panel--plugins">
      <div className="panel__header">
        <h2>Plugin Registry</h2>
        <p className="panel__subhead">Activate widgets, nav hooks, and lightweight integrations.</p>
      </div>
      <div className="plugin-grid">
        {pluginDefinitions.map((plugin) => (
          <PluginSpotlight key={plugin.manifest.id} plugin={plugin.manifest} />
        ))}
      </div>
    </section>
  );
}
