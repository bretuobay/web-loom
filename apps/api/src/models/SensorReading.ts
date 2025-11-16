import { Table, Column, Model, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Sensor } from './Sensor';

interface SensorReadingAttributes {
  id: number;
  sensorId: number;
  timestamp: Date;
  value: number;
}

interface SensorReadingCreationAttributes extends Optional<SensorReadingAttributes, 'id'> {}

@Table
export class SensorReading extends Model<SensorReadingAttributes, SensorReadingCreationAttributes> {
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
