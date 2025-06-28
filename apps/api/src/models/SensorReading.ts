import { Table, Column, Model, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Sensor } from './Sensor';

@Table
export class SensorReading extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @ForeignKey(() => Sensor)
  @Column
  sensorId!: number;

  @BelongsTo(() => Sensor)
  sensor!: Sensor;

  @Column
  timestamp!: Date;

  @Column
  value!: number;
}
