import React, { useEffect } from 'react';
import type { PluginModule, PluginSDK } from '@repo/plugin-core';
import { registerManifestContributions, unregisterManifestContributions } from '../utils/manifestHelpers';
import SensorReadingCard from '../../components/SensorReadingCard';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { useSignal } from '../../hooks/useSignal';

const SensorReadingWidget: React.FC = () => {
  const readings = useSignal(sensorReadingViewModel.data$);

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
