const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('admin', 'doctor', 'therapist', 'secretary'),
        allowNull: false,
        defaultValue: 'doctor',
    },
    // Link to therapist if user is a therapist
    therapistId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Therapists',
            key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
    },
}, {
    indexes: [
        {
            fields: ['username']
        },
        {
            fields: ['therapistId']
        },
        {
            fields: ['role']
        }
    ]
});

module.exports = User;
