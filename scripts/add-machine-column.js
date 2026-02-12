const path = require('path');
const { sequelize } = require(path.join(__dirname, '..', 'src', 'config', 'db'));

(async () => {
    try {
        const queryInterface = sequelize.getQueryInterface();
        
        console.log('Adding machineId column to Appointments table...');

        try {
            await sequelize.query('ALTER TABLE "Appointments" ADD COLUMN IF NOT EXISTS "machineId" INTEGER REFERENCES "Machines" ("id") ON DELETE SET NULL ON UPDATE CASCADE;');
            console.log('✓ Added machineId column.');
        } catch (error) {
            console.log('! Could not add machineId column:', error.message);
        }

        console.log('Schema update complete.');
    } catch (error) {
        console.error('Fatal error updating schema:', error);
    } finally {
        await sequelize.close();
    }
})();
