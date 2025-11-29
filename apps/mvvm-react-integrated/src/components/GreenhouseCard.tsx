import type { GreenhouseListData } from '@repo/view-models/GreenHouseViewModel';
import React from 'react';
import { Link } from 'react-router-dom';

interface GreenhouseCardProps {
  greenHouses: GreenhouseListData | null;
}

const GreenhouseCard: React.FC<GreenhouseCardProps> = ({ greenHouses }) => {
  if (!greenHouses) return null;
  return (
    <Link to="/greenhouses" className="card-link">
      <div className="card">
        <h3 className="card-header">Greenhouses</h3>
        <div className="card-body">
          <span className="card-value">{greenHouses.length}</span>
          <span className="card-label">Active Locations</span>
        </div>
      </div>
    </Link>
  );
};

export default GreenhouseCard;
