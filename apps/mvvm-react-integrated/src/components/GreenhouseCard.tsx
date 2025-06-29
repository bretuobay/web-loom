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
      <Link to="/greenhouses">
        <h3 className="card-header">Greenhouses</h3>
      </Link>
      <p className="card-body">Total: {greenHouses.length}</p>
    </div>
  );
};

export default GreenhouseCard;
