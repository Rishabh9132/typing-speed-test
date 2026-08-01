import { DataTypes } from 'sequelize';

// Sequelize model mapped onto the Knex-migrated `typing_results` table.
// Schema is owned by the migration; `timestamps: false` because we manage
// created_at ourselves and there is no updated_at column.
export function defineTypingResult(sequelize) {
  return sequelize.define(
    'TypingResult',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'anonymous' },
      wpm: { type: DataTypes.INTEGER, allowNull: false },
      cpm: { type: DataTypes.INTEGER, allowNull: false },
      accuracy: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      characters: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      errors: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      duration: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      tableName: 'typing_results',
      timestamps: false,
    }
  );
}
