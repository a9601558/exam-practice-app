import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// MySQL 连接配置
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '3306';
const DB_NAME = process.env.DB_NAME || 'exam_practice_app';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';

// 创建 Sequelize 实例
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: process.env.NODE_ENV === 'production' ? 5 : 3,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// 连接到数据库
const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 根据环境决定是否同步模型到数据库
    if (process.env.NODE_ENV === 'development' && process.env.SYNC_DB === 'true') {
      await sequelize.sync({ alter: true });
      console.log('数据库模型同步完成');
    }
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
};

export { sequelize };
export default connectDB; 