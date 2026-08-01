import { DataTypes } from 'sequelize';

// One row per (user, lesson): best score, stars, and completion.
export function defineLessonProgress(sequelize) {
  return sequelize.define(
    'LessonProgress',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      lesson_key: { type: DataTypes.STRING(80), allowNull: false },
      stars: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      best_wpm: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      best_accuracy: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      tableName: 'lesson_progress',
      timestamps: false,
      indexes: [{ unique: true, fields: ['user_id', 'lesson_key'] }],
    }
  );
}
