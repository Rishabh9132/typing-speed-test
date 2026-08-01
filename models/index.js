import { Sequelize } from 'sequelize';
import 'dotenv/config';
import { defineTypingResult } from './TypingResult.js';
import { defineUser } from './User.js';
import { defineLesson } from './Lesson.js';
import { defineLessonProgress } from './LessonProgress.js';

export const sequelize = new Sequelize(
  process.env.DB_NAME || 'postgres',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'admin',
  {
    host: process.env.DB_ADDRESS || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: process.env.DB_DEBUG === 'true' ? console.log : false,
  }
);

export const TypingResult = defineTypingResult(sequelize);
export const User = defineUser(sequelize);
export const Lesson = defineLesson(sequelize);
export const LessonProgress = defineLessonProgress(sequelize);

// Associations
User.hasMany(LessonProgress, { foreignKey: 'user_id' });
LessonProgress.belongsTo(User, { foreignKey: 'user_id' });
Lesson.hasMany(LessonProgress, { foreignKey: 'lesson_key', sourceKey: 'lesson_key' });
LessonProgress.belongsTo(Lesson, { foreignKey: 'lesson_key', targetKey: 'lesson_key' });
