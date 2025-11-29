import type { GreenhouseListData } from '@repo/view-models/GreenHouseViewModel';
import React from 'react';
import { Link } from 'react-router-dom';

interface GreenhouseCardProps {
  greenHouses: GreenhouseListData | null;
}

const GreenhouseCard: React.FC<GreenhouseCardProps> = ({ greenHouses }) => {
  if (!greenHouses) return null;
  return (
    <div className="card">
      <h3 className="card-header">
        <Link to="/greenhouses" className="card-link card-header-link">
          Greenhouses
        </Link>
      </h3>
      <div className="card-body">
        <span className="card-value">{greenHouses.length}</span>
        <span className="card-label">Active Locations</span>
      </div>
    </div>
  );
};

export default GreenhouseCard;
