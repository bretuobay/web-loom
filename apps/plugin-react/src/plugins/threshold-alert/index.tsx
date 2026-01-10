import React, { useEffect } from 'react';
import type { PluginModule, PluginSDK } from '@repo/plugin-core';
import { registerManifestContributions, unregisterManifestContributions } from '../utils/manifestHelpers';
import ThresholdAlertCard from '../../components/ThresholdAlertCard';
import { thresholdAlertViewModel, type ThresholdAlertListData } from '@repo/view-models/ThresholdAlertViewModel';
import { useObservable } from '../../hooks/useObservable';

const ThresholdAlertWidget: React.FC = () => {
  const alerts = useObservable(thresholdAlertViewModel.data$, null as ThresholdAlertListData | null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await thresholdAlertViewModel.fetchCommand.execute();
      } catch (error) {
        console.error('[threshold alert widget] failed to load data', error);
      }
    };

    fetchData();
  }, []);

  return <ThresholdAlertCard thresholdAlerts={alerts ?? []} />;
};

let activeSdk: PluginSDK | null = null;

const thresholdAlertModule: PluginModule = {
  init: async (sdk) => {
    activeSdk = sdk;
    console.debug('[threshold-alert] initialized');
  },
  mount: async (sdk) => {
    activeSdk = sdk;
    registerManifestContributions(sdk);
    console.debug('[threshold-alert] mounted');
  },
  unmount: async () => {
    if (!activeSdk) return;
    unregisterManifestContributions(activeSdk);
    console.debug('[threshold-alert] unmounted');
    activeSdk = null;
  },
};

export { ThresholdAlertWidget };
export default thresholdAlertModule;
