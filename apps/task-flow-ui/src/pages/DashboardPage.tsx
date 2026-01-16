import type { ComponentType } from 'react';
import type { PluginDefinition, PluginWidgetDefinition } from '@repo/plugin-core';
import { PluginSpotlight } from '../components/PluginSpotlight';

interface DashboardPageProps {
  pluginDefinitions: PluginDefinition[];
}

type WidgetEntry = {
  pluginId: string;
  pluginName: string;
  widget: PluginWidgetDefinition<ComponentType<unknown>>;
};

export function DashboardPage({ pluginDefinitions }: DashboardPageProps) {
  const pluginWidgets: WidgetEntry[] = pluginDefinitions.flatMap((plugin) =>
    (plugin.manifest.widgets ?? []).map((widget) => ({
      pluginId: plugin.manifest.id,
      pluginName: plugin.manifest.name,
      widget: widget as PluginWidgetDefinition<ComponentType<unknown>>
    }))
  );

  return (
    <section className="panel panel--plugins">
      <div className="panel__header">
        <h2>Plugin Registry</h2>
        <p className="panel__subhead">Activate widgets, nav hooks, and lightweight integrations.</p>
      </div>

      <div className="plugin-dashboard">
        {pluginWidgets.length > 0 && (
          <div className="plugin-dashboard__widgets">
            <div className="plugin-widget-grid">
              {pluginWidgets.map(({ pluginId, pluginName, widget }) => {
                const WidgetComponent = widget.component;
                return (
                  <article className="plugin-widget" key={`${pluginId}-${widget.id}`}>
                    <header className="plugin-widget__header">
                      <div>
                        <p className="plugin-spotlight__meta">{pluginId}</p>
                        <h3>{widget.title}</h3>
                      </div>
                      <p className="plugin-widget__source">{pluginName}</p>
                    </header>
                    <div className="plugin-widget__body">{WidgetComponent ? <WidgetComponent /> : null}</div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        <div className="plugin-dashboard__registry">
          {pluginDefinitions.map((plugin) => (
            <PluginSpotlight key={plugin.manifest.id} plugin={plugin.manifest} />
          ))}
        </div>
      </div>
    </section>
  );
}
