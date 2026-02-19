'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Appointments', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            publicId: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                unique: true,
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            time: {
                type: Sequelize.TIME,
                allowNull: false,
            },
            patientName: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            patientContact: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            durationMinutes: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 45,
            },
            status: {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: 'scheduled',
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            creationDate: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            batchId: {
                type: Sequelize.UUID,
                allowNull: true,
            },
            patientId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'Patients',
                    key: 'id',
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            },
            patientPublicId: {
                type: Sequelize.UUID,
                allowNull: true,
            },
            therapistId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'Therapists',
                    key: 'id',
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            },
            machineId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'Machines',
                    key: 'id',
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        await queryInterface.addIndex('Appointments', ['date', 'therapistId']);
        await queryInterface.addIndex('Appointments', ['patientId']);
        await queryInterface.addIndex('Appointments', ['publicId']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('Appointments');
    },
};
