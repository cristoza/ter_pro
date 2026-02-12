const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Therapist = sequelize.define('Therapist', {
  publicId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    // Removed isEmail validation to avoid issues with null values or empty strings being passed incorrectly
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  workingHours: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  specialty: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Físico',
  },
});

module.exports = Therapist;
