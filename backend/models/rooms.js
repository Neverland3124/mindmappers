import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { User } from "./users.js";

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
  generatingImage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    // 0 means no image
    // 1 is generating file name of aws s3 bucket
    // 2 is have filename in aws s3 bucket
  },
  // UserId represents the owner of the room
});

User.hasOne(Room);
Room.belongsTo(User);
