const path = require('path');
const { sequelize } = require(path.join(__dirname, '..', 'src', 'config', 'db'));
(async ()=>{
  const qi = sequelize.getQueryInterface();
  try{
    const tables = await qi.showAllTables();
    const tableName = tables.includes('Patients') ? 'Patients' : (tables.includes('patients') ? 'patients' : null);
    if(!tableName){ console.log('Patients table not found'); process.exit(1); }
    const desc = await qi.describeTable(tableName);
    if(!desc.cedula){
      console.log('Adding cedula column (nullable) to', tableName);
      await qi.addColumn(tableName, 'cedula', { type: 'VARCHAR(50)', allowNull: true });
      try{ await sequelize.query(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${tableName}_cedula_unique" UNIQUE ("cedula")`); }catch(e){console.log('unique constraint issue:', e.message)}
    } else { console.log('cedula column already exists'); }
    await sequelize.close();
    process.exit(0);
  }catch(err){ console.error('add-cedula failed:', err); try{ await sequelize.close(); }catch(_){} process.exit(1);} 
})();
