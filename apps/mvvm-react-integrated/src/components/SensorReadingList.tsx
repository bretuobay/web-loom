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
    <>
      <Link to="/" className="back-button">
        <img src={BackArrow} alt="Back to dashboard" style={{ width: '36px', height: '36px' }} />
      </Link>
      <div className="card">
        <h1 className="card-header">Sensor Readings</h1>
        {readingList.data && readingList.data.length > 0 ? (
          <ul className="card-body list">
            {readingList.data.map((reading) => (
              <li key={reading.id + reading.timestamp} className="list-item">
                Reading ID: {reading.sensorId}, Sensor ID: {reading.sensorId}, Timestamp:{' '}
                {new Date(reading.timestamp).toLocaleString()}, Value: {reading.value}
              </li>
            ))}
          </ul>
        ) : (
          <p>No sensor readings found or still loading...</p>
        )}
      </div>
    </>
  );
}
