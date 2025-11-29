import type { SensorListData } from '@repo/view-models/SensorViewModel';
import React from 'react';
import { Link } from 'react-router-dom';

interface SensorCardProps {
  sensors: SensorListData | null;
}

const SensorCard: React.FC<SensorCardProps> = ({ sensors }) => {
  if (!sensors) return null;
  return (
    <Link to="/sensors" className="card-link">
      <div className="card">
        <h3 className="card-header">Sensors</h3>
        <div className="card-body">
          <span className="card-value">{sensors.length}</span>
          <span className="card-label">Monitoring Devices</span>
        </div>
      </div>
    </Link>
  );
};

export default SensorCard;
