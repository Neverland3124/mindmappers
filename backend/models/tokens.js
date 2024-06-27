import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { User } from "./users.js";

export const Token = sequelize.define("Token", {
  // Default foreign UserId to represent the user of the token
  access_token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  refresh_token: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  scope: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  token_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  id_token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  expiry_date: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
});

User.hasMany(Token);
Token.belongsTo(User);
