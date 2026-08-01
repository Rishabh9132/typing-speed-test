import { DataTypes } from 'sequelize';

// Lightweight identity — a name is enough to key progress in this app.
export function defineUser(sequelize) {
  return sequelize.define(
    'User',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: DataTypes.STRING(40), allowNull: false, unique: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'users', timestamps: false }
  );
}
