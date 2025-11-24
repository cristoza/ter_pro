const path = require('path');
const { sequelize } = require(path.join(__dirname, '..', 'src', 'config', 'db'));
(async () => {
  try {
    const qi = sequelize.getQueryInterface();
    const tables = ['Therapists','Patients','Appointments','TherapistAvailabilities'];
    for (const t of tables) {
      try {
        let d;
        try { d = await qi.describeTable(t); }
        catch(e) { d = await qi.describeTable(t.toLowerCase()); }
        console.log(t + ' columns:', Object.keys(d));
      } catch (e) {
        console.log('No description for', t);
      }
    }
  } catch (err) {
    console.error('describe error:', err.message);
  } finally {
    await sequelize.close();
  }
})();
