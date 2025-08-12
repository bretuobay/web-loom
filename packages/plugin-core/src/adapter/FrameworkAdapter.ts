import { TComponent } from '../contracts/PluginManifest';

/**
 * The FrameworkAdapter is responsible for bridging the gap between the
 * framework-agnostic plugin core and the specific UI framework used by the host application.
 *
 * The host application must provide an implementation of this interface.
 *
 * @template T The base component type for the target framework (e.g., React.ComponentType, Vue.Component).
 */
export interface FrameworkAdapter<T extends TComponent = TComponent> {
  /**
   * Renders a plugin's component into a given DOM element.
   * @param component The framework-specific component to render.
   * @param container The HTMLElement to render the component into.
   */
  mountComponent(component: T, container: HTMLElement): void;

  /**
   * Unmounts and cleans up a rendered component from a DOM element.
   * @param container The HTMLElement from which to unmount the component.
   */
  unmountComponent(container: HTMLElement): void;
}
