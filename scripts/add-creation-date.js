const path = require('path');
const { sequelize } = require(path.join(__dirname, '..', 'src', 'config', 'db'));

const { DataTypes } = require('sequelize');

(async function() {
  const qi = sequelize.getQueryInterface();
  try {
    const table = 'Appointments';
    const desc = await qi.describeTable(table);
    
    if (!desc.creationDate) {
      console.log('Adding creationDate column to Appointments...');
      await qi.addColumn(table, 'creationDate', { type: DataTypes.DATEONLY, allowNull: true });
    } else {
      console.log('creationDate column already exists.');
    }

    // Backfill
    console.log('Backfilling creationDate from createdAt...');
    // We can do this with a raw query for efficiency
    await sequelize.query(`UPDATE "Appointments" SET "creationDate" = "createdAt"::date WHERE "creationDate" IS NULL`);
    
    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
})();
