import { Sequelize } from 'sequelize-typescript';
import sqlite3 from 'sqlite3';
import { Greenhouse } from './Greenhouse';
import { Sensor } from './Sensor';
import { SensorReading } from './SensorReading';
import { ThresholdAlert } from './ThresholdAlert';
import { User } from './User';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  dialectModule: sqlite3,
  storage: './db.sqlite',
  models: [Greenhouse, Sensor, SensorReading, ThresholdAlert, User],
});
