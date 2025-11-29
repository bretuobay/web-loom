import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackArrow from '../assets/back-arrow.svg';
import { useAppContext } from '../providers/AppProvider';
import { type SensorReadingListData } from '@repo/view-models/SensorReadingViewModel';
import { type EndpointState } from '@web-loom/query-core';

export const READINGS_ENDPOINT_KEY = 'posts';

async function fetchReadings(): Promise<SensorReadingListData> {
  const response = await fetch('http://localhost:3700/api/readings');
  if (!response.ok) {
    throw new Error('Network response was not ok for posts');
  }
  return response.json();
}

export function SensorReadingList() {
  // const readingList = useObservable(sensorReadingViewModel.data$, []);
  const { queryCore } = useAppContext();

  const [readingList, setReadingList] = useState<EndpointState<SensorReadingListData>>({
    data: undefined,
    isLoading: true,
    isError: false,
    error: undefined,
    lastUpdated: undefined,
  });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function setupEndpoint() {
      // Define the endpoint (it might have been defined elsewhere, QueryCore handles re-definition gracefully)
      await queryCore.defineEndpoint<SensorReadingListData>(READINGS_ENDPOINT_KEY, fetchReadings);

      // Subscribe to the endpoint
      unsubscribe = queryCore.subscribe<SensorReadingListData>(READINGS_ENDPOINT_KEY, (state) => {
        setReadingList(state);
      });

      // Initial fetch if not already loading or data not present
      const currentState = queryCore.getState<SensorReadingListData>(READINGS_ENDPOINT_KEY);
      if (!currentState.isLoading && !currentState.data) {
        // Check if data is undefined or empty array before refetching
        queryCore.refetch<SensorReadingListData>(READINGS_ENDPOINT_KEY);
      }
    }

    setupEndpoint();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log('[SensorReadingList] Reading List:', readingList.data);

  return (
    <div className="page-container">
      <Link to="/" className="back-button">
        <img src={BackArrow} alt="Back to dashboard" />
        Back to Dashboard
      </Link>

      <div className="page-header-section">
        <h1 className="page-title">Sensor Readings</h1>
        <p className="page-description">View all sensor readings and their timestamps</p>
      </div>

      {readingList.isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading sensor readings...</p>
        </div>
      ) : readingList.data && readingList.data.length > 0 ? (
        <ul className="list-container">
          {readingList.data.map((reading) => (
            <li key={reading.id + reading.timestamp} className="list-item-card">
              <div className="list-item-header">
                <h3 className="list-item-title">Reading #{reading.id}</h3>
                <span className="list-item-id">{new Date(reading.timestamp).toLocaleString()}</span>
              </div>
              <div className="list-item-body">
                <div className="list-item-field">
                  <span className="list-item-field-label">Sensor ID</span>
                  <span className="list-item-field-value">{reading.sensorId}</span>
                </div>
                <div className="list-item-field">
                  <span className="list-item-field-label">Value</span>
                  <span className="list-item-field-value">{reading.value}</span>
                </div>
                <div className="list-item-field">
                  <span className="list-item-field-label">Timestamp</span>
                  <span className="list-item-field-value">{new Date(reading.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <p className="empty-state-title">No sensor readings found</p>
          <p className="empty-state-description">Readings will appear here once sensors start collecting data</p>
        </div>
      )}
    </div>
  );
}
