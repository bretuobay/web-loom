import { Table, Column, Model, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Greenhouse } from './Greenhouse';

interface ThresholdAlertAttributes {
  id: number;
  greenhouseId: number;
  sensorType: 'temperature' | 'humidity' | 'soilMoisture' | 'lightIntensity';
  minValue: number;
  maxValue: number;
}

interface ThresholdAlertCreationAttributes extends Optional<ThresholdAlertAttributes, 'id'> {}

@Table
export class ThresholdAlert extends Model<ThresholdAlertAttributes, ThresholdAlertCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @ForeignKey(() => Greenhouse)
  @Column
  greenhouseId!: number;

  @BelongsTo(() => Greenhouse)
  greenhouse!: Greenhouse;

  @Column
  sensorType!: 'temperature' | 'humidity' | 'soilMoisture' | 'lightIntensity';

  @Column
  minValue!: number;

  @Column
  maxValue!: number;
}
