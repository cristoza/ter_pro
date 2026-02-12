const path = require('path');
const { sequelize } = require(path.join(__dirname, '..', 'src', 'config', 'db'));

(async () => {
  try {
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Appointments';
    `);
    
    console.log('Columns in Appointments table:');
    const columns = results.map(r => r.column_name);
    console.log(columns.join(', '));
    
    if (columns.includes('status') && columns.includes('notes')) {
        console.log('SUCCESS: status and notes columns exist.');
    } else {
        console.log('FAILURE: Missing columns.');
    }
  } catch (err) {
    console.error('Error verifying columns:', err);
  } finally {
    await sequelize.close();
  }
})();
