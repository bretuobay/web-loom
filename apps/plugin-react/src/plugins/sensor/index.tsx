import React, { useEffect } from 'react';
import type { PluginModule, PluginSDK } from '@repo/plugin-core';
import { registerManifestContributions, unregisterManifestContributions } from '../utils/manifestHelpers';
import SensorCard from '../../components/SensorCard';
import { sensorViewModel, type SensorListData } from '@repo/view-models/SensorViewModel';
import { useObservable } from '../../hooks/useObservable';

const SensorWidget: React.FC = () => {
  const sensors = useObservable(sensorViewModel.data$, [] as SensorListData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await sensorViewModel.fetchCommand.execute();
      } catch (error) {
        console.error('[sensor widget] failed to load data', error);
      }
    };

    fetchData();
  }, []);

  return <SensorCard sensors={sensors} />;
};

let activeSdk: PluginSDK | null = null;

const sensorModule: PluginModule = {
  init: async (sdk) => {
    activeSdk = sdk;
    console.debug('[sensor] initialized');
  },
  mount: async (sdk) => {
    activeSdk = sdk;
    registerManifestContributions(sdk);
    console.debug('[sensor] mounted');
  },
  unmount: async () => {
    if (!activeSdk) return;
    unregisterManifestContributions(activeSdk);
    console.debug('[sensor] unmounted');
    activeSdk = null;
  },
};

export { SensorWidget };
export default sensorModule;
