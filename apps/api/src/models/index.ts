import { Sequelize } from 'sequelize-typescript';
import { Greenhouse } from './Greenhouse';
import { Sensor } from './Sensor';
import { SensorReading } from './SensorReading';
import { ThresholdAlert } from './ThresholdAlert';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db.sqlite',
  models: [Greenhouse, Sensor, SensorReading, ThresholdAlert],
});
