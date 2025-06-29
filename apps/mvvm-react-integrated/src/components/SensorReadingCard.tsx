import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { SensorReadingListData } from '@repo/view-models/SensorReadingViewModel';

// Register Chart.js components
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

interface SensorReadingCardProps {
  sensorReadings: SensorReadingListData;
}

const SensorReadingCard: React.FC<SensorReadingCardProps> = ({ sensorReadings }) => {
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (sensorReadings.length === 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return; // Don't render chart if there's no data
    }

    const canvasElement = document.getElementById('sensorReadingsChart') as HTMLCanvasElement | null;
    if (!canvasElement) {
      console.error('Canvas element not found');
      return;
    }
    const ctx = canvasElement.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return;
    }

    // Destroy previous chart instance if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const chartData = {
      labels: sensorReadings.map((reading) => new Date(reading.timestamp).toLocaleTimeString()),
      datasets: [
        {
          label: 'Sensor Value',
          data: sensorReadings.map((reading) => reading.value),
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Value',
          },
        },
      },
    };

    // Create new chart instance
    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: chartOptions,
    });

    // Cleanup function to destroy chart on component unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [sensorReadings]); // Re-run effect if sensorReadings change

  return (
    <div className="card">
      <Link to="/sensor-readings" className="card-header-link">
        <h3 className="card-title">Sensor Readings</h3>
      </Link>
      <div className="card-content">
        <canvas id="sensorReadingsChart"></canvas>
      </div>
      <p className="card-content">Total Readings: {sensorReadings.length}</p>
    </div>
  );
};

export default SensorReadingCard;
