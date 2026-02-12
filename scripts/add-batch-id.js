const { DataTypes } = require('sequelize');
const path = require('path');
const { sequelize } = require(path.join(__dirname, '..', 'src', 'config', 'db'));

(async function() {
  const qi = sequelize.getQueryInterface();
  try {
    const table = 'Appointments';
    const desc = await qi.describeTable(table);
    
    if (!desc.batchId) {
      console.log('Adding batchId column to Appointments...');
      await qi.addColumn(table, 'batchId', { type: DataTypes.UUID, allowNull: true });
    } else {
      console.log('batchId column already exists.');
    }
    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
})();
