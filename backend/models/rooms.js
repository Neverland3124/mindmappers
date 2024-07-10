import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";

export const Room = sequelize.define("Room", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  owner: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});
