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

    // Get CSS variables for theming
    const rootStyles = getComputedStyle(document.documentElement);
    const brandPrimary = rootStyles.getPropertyValue('--colors-brand-primary').trim() || '#3b82f6';
    const brandSecondary = rootStyles.getPropertyValue('--colors-brand-secondary').trim() || '#8b5cf6';
    const textPrimary = rootStyles.getPropertyValue('--colors-text-primary').trim() || '#111827';
    const textMuted = rootStyles.getPropertyValue('--colors-text-muted').trim() || '#9ca3af';
    const borderDefault = rootStyles.getPropertyValue('--colors-border-default').trim() || '#e5e7eb';

    const chartData = {
      labels: sensorReadings.map((reading) => new Date(reading.timestamp).toLocaleTimeString()),
      datasets: [
        {
          label: 'Sensor Value',
          data: sensorReadings.map((reading) => reading.value),
          fill: true,
          backgroundColor: `${brandPrimary}20`,
          borderColor: brandPrimary,
          pointBackgroundColor: brandPrimary,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: brandSecondary,
          pointHoverBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          tension: 0.4,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          labels: {
            color: textPrimary,
            font: {
              size: 12,
              weight: '500' as const,
            },
            padding: 12,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: brandPrimary,
          borderWidth: 1,
          padding: 12,
          displayColors: true,
        },
      },
      scales: {
        x: {
          grid: {
            display: true,
            color: borderDefault,
          },
          ticks: {
            color: textMuted,
            font: {
              size: 11,
            },
          },
          title: {
            display: true,
            text: 'Time',
            color: textPrimary,
            font: {
              size: 12,
              weight: '600' as const,
            },
          },
        },
        y: {
          grid: {
            display: true,
            color: borderDefault,
          },
          ticks: {
            color: textMuted,
            font: {
              size: 11,
            },
          },
          title: {
            display: true,
            text: 'Value',
            color: textPrimary,
            font: {
              size: 12,
              weight: '600' as const,
            },
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
    <div className="card card-chart">
      <div className="chart-header">
        <div>
          <h3 className="card-header">Sensor Readings Over Time</h3>
          <p className="chart-subtitle">{sensorReadings.length} data points recorded</p>
        </div>
        <Link to="/sensor-readings" className="chart-view-all">
          View All →
        </Link>
      </div>
      <div className="chart-container">
        {sensorReadings.length > 0 ? (
          <canvas id="sensorReadingsChart"></canvas>
        ) : (
          <div className="empty-state">
            <p className="empty-state-title">No sensor data available</p>
            <p className="empty-state-description">Start monitoring to see real-time sensor readings</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorReadingCard;
