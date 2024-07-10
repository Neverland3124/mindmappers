import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";

export const User = sequelize.define("User", {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  picture: {
    type: DataTypes.STRING,
    allowNull: false,
  }, // TODO: show the picture
});
