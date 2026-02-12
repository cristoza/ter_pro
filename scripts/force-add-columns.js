const path = require('path');
const { sequelize } = require(path.join(__dirname, '..', 'src', 'config', 'db'));

(async () => {
  try {
    console.log('Attempting to add missing columns to Appointments table...');

    // Add status column
    try {
        await sequelize.query('ALTER TABLE "Appointments" ADD COLUMN IF NOT EXISTS "status" VARCHAR(255) DEFAULT \'scheduled\';');
        console.log('✓ Added "status" column');
    } catch (e) {
        console.log('! Error adding "status" column (might already exist):', e.message);
    }

    // Add notes column
    try {
        await sequelize.query('ALTER TABLE "Appointments" ADD COLUMN IF NOT EXISTS "notes" TEXT;');
        console.log('✓ Added "notes" column');
    } catch (e) {
        console.log('! Error adding "notes" column (might already exist):', e.message);
    }
    
    console.log('Database schema update finished.');
  } catch (err) {
    console.error('Fatal error updating schema:', err);
  } finally {
    await sequelize.close();
  }
})();
