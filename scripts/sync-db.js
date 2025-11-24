const path = require('path');
const { sequelize } = require(path.join(__dirname, '..', 'src', 'config', 'db'));

(async function sync() {
  try {
    console.log('Running sequelize.sync({ alter: true }) ...');
    await sequelize.sync({ alter: true });
    console.log('DB sync (alter) complete');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('DB sync failed:', err);
    try { await sequelize.close(); } catch (_) {}
    process.exit(1);
  }
})();
