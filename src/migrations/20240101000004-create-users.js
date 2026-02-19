'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Users', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            username: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            role: {
                type: Sequelize.ENUM('admin', 'doctor', 'therapist', 'secretary'),
                allowNull: false,
                defaultValue: 'doctor',
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
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        await queryInterface.addIndex('Users', ['username']);
        await queryInterface.addIndex('Users', ['therapistId']);
        await queryInterface.addIndex('Users', ['role']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('Users');
    },
};
