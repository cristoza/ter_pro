const path = require('path');
const { sequelize } = require(path.join(__dirname, '..', 'src', 'config', 'db'));
(async function(){
  const qi = sequelize.getQueryInterface();
  try{
    const tables = await qi.showAllTables();
    const tableName = tables.includes('Appointments') ? 'Appointments' : (tables.includes('appointments')? 'appointments' : null);
    if(!tableName){ console.log('Appointments table not found'); process.exit(1); }
    const desc = await qi.describeTable(tableName);
    if(!desc.patientId){
      console.log('Adding patientId column to', tableName);
      await qi.addColumn(tableName, 'patientId', { type: 'INTEGER', allowNull: true });
      try{ await sequelize.query(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${tableName}_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patients"(id) ON DELETE SET NULL ON UPDATE CASCADE`); }catch(e){ console.log('FK add issue (might be ok):', e.message); }
    } else { console.log('patientId exists'); }
    if(!desc.patientPublicId){
      console.log('Adding patientPublicId column to', tableName);
      await qi.addColumn(tableName, 'patientPublicId', { type: 'UUID', allowNull: true });
    } else { console.log('patientPublicId exists'); }
    console.log('Done');
    await sequelize.close();
    process.exit(0);
  }catch(err){ console.error('failed:', err.message); try{ await sequelize.close(); }catch(_ ){} process.exit(1);} 
})();
