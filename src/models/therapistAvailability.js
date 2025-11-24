const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Weekly availability entries for therapists (recurring weekly)
const TherapistAvailability = sequelize.define('TherapistAvailability', {
  publicId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  therapistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  dayOfWeek: {
    // 0 = Sunday .. 6 = Saturday
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
}, {
  indexes: [
    {
      fields: ['therapistId', 'dayOfWeek']
    },
    {
      fields: ['publicId']
    }
  ]
});

module.exports = TherapistAvailability;
