const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Define Appointment model using Sequelize
const Appointment = sequelize.define('Appointment', {
    publicId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    time: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    patientName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    patientContact: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 45,
    },
    // optional FK to patient record
    patientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Patients', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
    },
    patientPublicId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    // optional foreign key to assign a therapist
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
            fields: ['date', 'therapistId']
        },
        {
            fields: ['therapistId', 'date']
        },
        {
            fields: ['patientId']
        },
        {
            fields: ['publicId']
        }
    ]
});

module.exports = Appointment;