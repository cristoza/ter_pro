const { Sequelize } = require('sequelize');
const { sequelize } = require('../src/config/db');

async function addSpecialtyColumn() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable('Therapists');
    
    if (!tableInfo.specialty) {
      console.log('Adding specialty column to Therapists table...');
      await queryInterface.addColumn('Therapists', 'specialty', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'Físico' // Default to Physical Therapist
      });
      console.log('Column added successfully.');
    } else {
      console.log('Column specialty already exists.');
    }
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    await sequelize.close();
  }
}

addSpecialtyColumn();
