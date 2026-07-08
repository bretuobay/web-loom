import React, { useEffect } from 'react';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { useSignal } from '../hooks/useSignal';

import CompositeCommandPanel from './CompositeCommandPanel';
import GreenhouseCard from './GreenhouseCard';
import SensorCard from './SensorCard';
import SensorReadingCard from './SensorReadingCard';
import ThresholdAlertCard from './ThresholdAlertCard';
import FluentCommandShowcase from './FluentCommandShowcase';

const Dashboard: React.FC = () => {
  const greenHouses = useSignal(greenHouseViewModel.data$);
  const isLoadingGreenHouses = useSignal(greenHouseViewModel.isLoading$);

  const sensors = useSignal(sensorViewModel.data$);
  const isLoadingSensors = useSignal(sensorViewModel.isLoading$);

  const sensorReadings = useSignal(sensorReadingViewModel.data$);
  const isLoadingSensorReadings = useSignal(sensorReadingViewModel.isLoading$);

  const thresholdAlerts = useSignal(thresholdAlertViewModel.data$);
  const isLoadingThresholdAlerts = useSignal(thresholdAlertViewModel.isLoading$);

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
      {isLoading && (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      )}
      {!isLoading && (
        <>
          <div className="dashboard-header">
            <h2>Dashboard Overview</h2>
            <p className="dashboard-subtitle">Monitor your greenhouse environment in real-time</p>
          </div>

          <div className="dashboard-ops-panel">
            <CompositeCommandPanel />
          </div>

          <div className="dashboard-ops-panel">
            <FluentCommandShowcase />
          </div>

          {/* Stats Cards Row */}
          <div className="dashboard-stats-grid">
            <div className="stat-card-wrapper">
              <GreenhouseCard greenHouses={greenHouses} />
            </div>
            <div className="stat-card-wrapper">
              <SensorCard sensors={sensors} />
            </div>
            <div className="stat-card-wrapper">
              <ThresholdAlertCard thresholdAlerts={thresholdAlerts ?? []} />
            </div>
          </div>

          {/* Full-width Chart Section */}
          <div className="dashboard-chart-section">
            <SensorReadingCard sensorReadings={sensorReadings ?? []} />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
