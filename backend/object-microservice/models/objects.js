import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { Room } from "./rooms.js";

export const Object = sequelize.define("Object", {
  text: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  loc: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  parent: {
    type: DataTypes.INTEGER, // object id of its parent
    allowNull: true,
  },
  key: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  dir: {
    // direction
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "right",
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  font: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "16px sans-serif",
  },
});

Room.hasMany(Object, { onDelete: "CASCADE" });
Object.belongsTo(Room);
