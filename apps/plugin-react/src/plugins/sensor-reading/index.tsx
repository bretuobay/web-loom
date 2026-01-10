import React, { useEffect } from 'react';
import type { PluginModule, PluginSDK } from '@repo/plugin-core';
import { registerManifestContributions, unregisterManifestContributions } from '../utils/manifestHelpers';
import SensorReadingCard from '../../components/SensorReadingCard';
import { sensorReadingViewModel, type SensorReadingListData } from '@repo/view-models/SensorReadingViewModel';
import { useObservable } from '../../hooks/useObservable';

const SensorReadingWidget: React.FC = () => {
  const readings = useObservable(sensorReadingViewModel.data$, null as SensorReadingListData | null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await sensorReadingViewModel.fetchCommand.execute();
      } catch (error) {
        console.error('[sensor reading widget] failed to load data', error);
      }
    };

    fetchData();
  }, []);

  return <SensorReadingCard sensorReadings={readings ?? []} />;
};

let activeSdk: PluginSDK | null = null;

const sensorReadingModule: PluginModule = {
  init: async (sdk) => {
    activeSdk = sdk;
    console.debug('[sensor-reading] initialized');
  },
  mount: async (sdk) => {
    activeSdk = sdk;
    registerManifestContributions(sdk);
    console.debug('[sensor-reading] mounted');
  },
  unmount: async () => {
    if (!activeSdk) return;
    unregisterManifestContributions(activeSdk);
    console.debug('[sensor-reading] unmounted');
    activeSdk = null;
  },
};

export { SensorReadingWidget };
export default sensorReadingModule;
