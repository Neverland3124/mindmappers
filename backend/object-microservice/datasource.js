import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DATABASE_NAME_OBJECT,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.DATABASE_HOST_OBJECT,
    port: process.env.DATABASE_PORT,
    dialect: "postgres",
  },
);
