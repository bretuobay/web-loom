import React, { useEffect } from 'react';
import type { PluginModule, PluginSDK } from '@repo/plugin-core';
import { registerManifestContributions, unregisterManifestContributions } from '../utils/manifestHelpers';
import GreenhouseCard from '../../components/GreenhouseCard';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { useSignal } from '../../hooks/useSignal';

const GreenhouseWidget: React.FC = () => {
  const greenHouses = useSignal(greenHouseViewModel.data$);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await greenHouseViewModel.fetchCommand.execute();
      } catch (error) {
        console.error('[greenhouse widget] failed to load data', error);
      }
    };

    fetchData();
  }, []);

  return <GreenhouseCard greenHouses={greenHouses} />;
};

let activeSdk: PluginSDK | null = null;

const greenhouseModule: PluginModule = {
  init: async (sdk) => {
    activeSdk = sdk;
    console.debug('[greenhouse] initialized');
  },
  mount: async (sdk) => {
    activeSdk = sdk;
    registerManifestContributions(sdk);
    console.debug('[greenhouse] mounted');
  },
  unmount: async () => {
    if (!activeSdk) return;
    unregisterManifestContributions(activeSdk);
    console.debug('[greenhouse] unmounted');
    activeSdk = null;
  },
};

export { GreenhouseWidget };
export default greenhouseModule;
