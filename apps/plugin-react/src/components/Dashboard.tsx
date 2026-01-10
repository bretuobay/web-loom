import React, { useEffect } from 'react';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { useObservable } from '../hooks/useObservable';

import GreenhouseCard from './GreenhouseCard';
import SensorCard from './SensorCard';
import SensorReadingCard from './SensorReadingCard';
import ThresholdAlertCard from './ThresholdAlertCard';

const Dashboard: React.FC = () => {
  const greenHouses = useObservable(greenHouseViewModel.data$, []);
  const isLoadingGreenHouses = useObservable(greenHouseViewModel.isLoading$, true);

  const sensors = useObservable(sensorViewModel.data$, []);
  const isLoadingSensors = useObservable(sensorViewModel.isLoading$, true);

  const sensorReadings = useObservable(sensorReadingViewModel.data$, []);
  const isLoadingSensorReadings = useObservable(sensorReadingViewModel.isLoading$, true);

  const thresholdAlerts = useObservable(thresholdAlertViewModel.data$, []);
  const isLoadingThresholdAlerts = useObservable(thresholdAlertViewModel.isLoading$, true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await greenHouseViewModel.fetchCommand.execute();
        await sensorViewModel.fetchCommand.execute();
        await sensorReadingViewModel.fetchCommand.execute();
        await thresholdAlertViewModel.fetchCommand.execute();
      } catch (error) {
        console.error('Error fetching data:', error);
        // Optionally, set an error state here to display to the user
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this runs once on mount

  const isLoading = isLoadingGreenHouses || isLoadingSensors || isLoadingSensorReadings || isLoadingThresholdAlerts;

  return (
    <div className="dashboard-container">
      {isLoading && <p>Loading dashboard data...</p>}
      {!isLoading && (
        <>
          <h2>Dashboard</h2>
          <div className="flex-container">
            <div className="flex-item">
              <GreenhouseCard greenHouses={greenHouses} />
            </div>
            <div className="flex-item">
              <SensorCard sensors={sensors} />
            </div>
            <div className="flex-item">
              <ThresholdAlertCard thresholdAlerts={thresholdAlerts ?? []} />
            </div>
            <div className="flex-item">
              <SensorReadingCard sensorReadings={sensorReadings ?? []} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
