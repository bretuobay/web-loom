import type { SensorListData } from '@repo/view-models/SensorViewModel';
import React from 'react';
import { Link } from 'react-router-dom';

interface SensorCardProps {
  sensors: SensorListData | null;
}

const SensorCard: React.FC<SensorCardProps> = ({ sensors }) => {
  if (!sensors) return null;
  return (
    <div className="card">
      <Link to="/sensors">
        <h3 className="card-header">Sensors</h3>
      </Link>
      <p className="card-body">Total: {sensors.length}</p>
    </div>
  );
};

export default SensorCard;
