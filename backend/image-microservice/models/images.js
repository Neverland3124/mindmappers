import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";

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
  // so instead of have foreign key, we store a field called RoomId
  RoomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  isImageReady: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0, // 0 - no image, 1 - generating, 2 - ready
  },
});