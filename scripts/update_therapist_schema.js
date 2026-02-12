const path = require('path');
const { sequelize } = require(path.join(__dirname, '..', 'src', 'config', 'db'));

(async () => {
    try {
        const queryInterface = sequelize.getQueryInterface();
        
        console.log('Updating Therapists table schema...');

        // 1. Make email nullable
        try {
            await sequelize.query('ALTER TABLE "Therapists" ALTER COLUMN "email" DROP NOT NULL;');
            console.log('✓ Email column is now nullable.');
        } catch (error) {
            console.log('! Could not alter email column (might already be nullable or other error):', error.message);
        }

        // 2. Add workingHours column
        try {
            await sequelize.query('ALTER TABLE "Therapists" ADD COLUMN IF NOT EXISTS "workingHours" VARCHAR(255);');
            console.log('✓ Added workingHours column.');
        } catch (error) {
            console.log('! Could not add workingHours column:', error.message);
        }

        console.log('Schema update complete.');
    } catch (error) {
        console.error('Fatal error updating schema:', error);
    } finally {
        await sequelize.close();
    }
})();