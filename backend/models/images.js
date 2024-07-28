import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { Room } from "./rooms.js";

export const Image = sequelize.define("Image", {
  imageFileName: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  imageUrlExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
});

Room.hasOne(Image, { onDelete: "CASCADE" });
Image.belongsTo(Room);
