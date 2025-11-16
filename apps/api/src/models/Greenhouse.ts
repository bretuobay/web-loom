import { Table, Column, Model, PrimaryKey, AutoIncrement, HasMany } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Sensor } from './Sensor';
import { ThresholdAlert } from './ThresholdAlert';

interface GreenhouseAttributes {
  id: number;
  name: string;
  location: string;
  size: string;
  cropType?: string;
}

interface GreenhouseCreationAttributes extends Optional<GreenhouseAttributes, 'id' | 'cropType'> {}

@Table
export class Greenhouse extends Model<GreenhouseAttributes, GreenhouseCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Column
  name!: string;

  @Column
  location!: string;

  @Column
  size!: string;

  @Column
  cropType?: string;

  @HasMany(() => Sensor)
  sensors!: Sensor[];

  @HasMany(() => ThresholdAlert)
  alerts!: ThresholdAlert[];
}
