const path = require('path');
const { sequelize } = require(path.join(__dirname, '..', 'src', 'config', 'db'));
const { randomUUID } = require('crypto');
const tablesToFix = ['Therapists','Patients','Appointments','TherapistAvailabilities'];
(async function fixAll(){
  const qi = sequelize.getQueryInterface();
  try{
    const existing = await qi.showAllTables();
    for(const t of tablesToFix){
      const tableName = existing.includes(t)? t : (existing.includes(t.toLowerCase())? t.toLowerCase() : null);
      if(!tableName){
        console.log('Table not found, skipping:', t);
        continue;
      }
      const desc = await qi.describeTable(tableName);
      if(!desc.publicId){
        console.log('Adding publicId to', tableName);
        await qi.addColumn(tableName, 'publicId', { type: 'UUID', allowNull: true });
      } else {
        console.log('publicId exists on', tableName);
      }
      const [rows] = await sequelize.query(`SELECT id FROM "${tableName}" WHERE "publicId" IS NULL`);
      if(rows.length){
        console.log('Populating', rows.length, 'rows on', tableName);
        for(const r of rows){
          const uuid = randomUUID();
          await sequelize.query(`UPDATE "${tableName}" SET "publicId"='${uuid}' WHERE id=${r.id}`);
        }
      }
      try{
        await sequelize.query(`ALTER TABLE "${tableName}" ALTER COLUMN "publicId" SET NOT NULL`);
      }catch(e){ console.log('Maybe already NOT NULL or failed:', e.message); }
      try{
        await sequelize.query(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${tableName}_publicId_unique" UNIQUE ("publicId")`);
      }catch(e){ console.log('Unique constraint already exists or failed:', e.message); }
    }
    console.log('All done');
    await sequelize.close();
    process.exit(0);
  }catch(err){
    console.error('fixAll failed:', err);
    try{ await sequelize.close(); }catch(_){}
    process.exit(1);
  }
})();
