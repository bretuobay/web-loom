import type { PluginModule, PluginSDK } from '@repo/plugin-core';
import { registerManifestContributions, unregisterManifestContributions } from '../utils/manifestHelpers';

let activeSdk: PluginSDK | null = null;

const navigationModule: PluginModule = {
  init: async (sdk) => {
    activeSdk = sdk;
    console.debug('[navigation] initialized');
  },
  mount: async (sdk) => {
    activeSdk = sdk;
    registerManifestContributions(sdk);
    console.debug('[navigation] mounted');
  },
  unmount: async () => {
    if (!activeSdk) return;
    unregisterManifestContributions(activeSdk);
    console.debug('[navigation] unmounted');
    activeSdk = null;
  },
};

export default navigationModule;
