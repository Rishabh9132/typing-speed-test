import { DataTypes } from 'sequelize';

// Read-only lesson catalog, owned by the migration + seed.
export function defineLesson(sequelize) {
  return sequelize.define(
    'Lesson',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      lesson_key: { type: DataTypes.STRING(80), allowNull: false, unique: true },
      unit: { type: DataTypes.STRING(60), allowNull: false },
      unit_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      lesson_order: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING(120), allowNull: false },
      type: { type: DataTypes.STRING(20), allowNull: false },
      new_keys: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      content: { type: DataTypes.TEXT, allowNull: false },
      target_wpm: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 15 },
      duration: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'lessons', timestamps: false }
  );
}
