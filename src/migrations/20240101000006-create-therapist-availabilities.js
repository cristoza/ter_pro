'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('TherapistAvailabilities', {
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
            therapistId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Therapists',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            dayOfWeek: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            startTime: {
                type: Sequelize.TIME,
                allowNull: false,
            },
            endTime: {
                type: Sequelize.TIME,
                allowNull: false,
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

        await queryInterface.addIndex('TherapistAvailabilities', ['therapistId', 'dayOfWeek']);
        await queryInterface.addIndex('TherapistAvailabilities', ['publicId']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('TherapistAvailabilities');
    },
};
