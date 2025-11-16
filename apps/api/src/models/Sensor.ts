import { Table, Column, Model, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Greenhouse } from './Greenhouse';
import { SensorReading } from './SensorReading';

interface SensorAttributes {
  id: number;
  type: 'temperature' | 'humidity' | 'soilMoisture' | 'lightIntensity';
  status: 'active' | 'inactive';
  greenhouseId: number;
}

interface SensorCreationAttributes extends Optional<SensorAttributes, 'id'> {}

@Table
export class Sensor extends Model<SensorAttributes, SensorCreationAttributes> {
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
