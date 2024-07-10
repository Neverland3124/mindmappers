import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { User } from "./users.js";

export const Webhook = sequelize.define("Webhook", {
  // Default foreign UserId to represent the user of the token
  webhookId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  friendName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  friendEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  roomName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

User.hasMany(Webhook);
Webhook.belongsTo(User);
