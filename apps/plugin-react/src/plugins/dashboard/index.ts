import type { PluginModule, PluginSDK } from '@repo/plugin-core';
import { registerManifestContributions, unregisterManifestContributions } from '../utils/manifestHelpers';

let activeSdk: PluginSDK | null = null;

const dashboardModule: PluginModule = {
  init: async (sdk) => {
    activeSdk = sdk;
    console.debug('[dashboard] initialized');
  },
  mount: async (sdk) => {
    activeSdk = sdk;
    registerManifestContributions(sdk);
    console.debug('[dashboard] mounted');
  },
  unmount: async () => {
    if (!activeSdk) return;
    unregisterManifestContributions(activeSdk);
    console.debug('[dashboard] unmounted');
    activeSdk = null;
  },
};

export default dashboardModule;
