import { Table, Column, Model, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Greenhouse } from './Greenhouse';

@Table
export class ThresholdAlert extends Model {
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
