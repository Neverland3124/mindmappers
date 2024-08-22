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
  // directly include user id here (owner of the room)
  UserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // store user name and avatar for the room, update when user change their profile
  ownerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ownerAvatar: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});