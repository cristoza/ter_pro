const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Machine = sequelize.define('Machine', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING, 
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'maintenance', 'retired'),
    defaultValue: 'active',
  },
  sessionDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 30, 
    allowNull: false
  }
});

module.exports = Machine;
