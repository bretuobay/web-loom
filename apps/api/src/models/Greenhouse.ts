import { Table, Column, Model, PrimaryKey, AutoIncrement, HasMany } from 'sequelize-typescript';
import { Sensor } from './Sensor';
import { ThresholdAlert } from './ThresholdAlert';

@Table
export class Greenhouse extends Model {
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
