import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { Room } from "./rooms.js";

export const Object = sequelize.define("Object", {
  text: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  x: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  y: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  size: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  parent: {
    type: DataTypes.INTEGER, // object id of its parent
    allowNull: true,
  },
});

Room.hasMany(Object, { onDelete: "CASCADE" });
Object.belongsTo(Room); // One time is enough