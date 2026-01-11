import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType } from 'sequelize-typescript';
import { Optional } from 'sequelize';

interface UserAttributes {
  id: number;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  firstName?: string;
  lastName?: string;
  sessionTokenHash?: string | null;
  sessionTokenExpiresAt?: Date | null;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'firstName' | 'lastName' | 'sessionTokenHash' | 'sessionTokenExpiresAt'> {}

@Table({
  tableName: 'Users',
  timestamps: true,
})
export class User extends Model<UserAttributes, UserCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Column({
    unique: true,
    validate: {
      isEmail: true,
    },
  })
  email!: string;

  @Column
  passwordHash!: string;

  @Column
  passwordSalt!: string;

  @Column({
    allowNull: true,
  })
  firstName?: string;

  @Column({
    allowNull: true,
  })
  lastName?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  sessionTokenHash?: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  sessionTokenExpiresAt?: Date | null;
}
