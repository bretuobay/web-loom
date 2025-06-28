import { Table, Column, Model, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Greenhouse } from './Greenhouse';
import { SensorReading } from './SensorReading';

@Table
export class Sensor extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Column
  type!: 'temperature' | 'humidity' | 'soilMoisture' | 'lightIntensity';

  @Column
  status!: 'active' | 'inactive';

  @ForeignKey(() => Greenhouse)
  @Column
  greenhouseId!: number;

  @BelongsTo(() => Greenhouse)
  greenhouse!: Greenhouse;

  @HasMany(() => SensorReading)
  readings!: SensorReading[];
}
