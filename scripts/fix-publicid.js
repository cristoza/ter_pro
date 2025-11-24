const path = require('path');
const { sequelize } = require(path.join(__dirname, '..', 'src', 'config', 'db'));
const { randomUUID } = require('crypto');
(async function fix() {
  const qi = sequelize.getQueryInterface();
  try {
    // add column if missing
    const tables = await qi.showAllTables();
    const hasTherapists = tables.includes('Therapists') || tables.includes('therapists');
    if (!hasTherapists) {
      console.log('No Therapists table found, aborting.');
      process.exit(1);
    }
    const tableName = tables.includes('Therapists') ? 'Therapists' : 'therapists';
    const desc = await qi.describeTable(tableName);
    if (!desc.publicId) {
      console.log('Adding publicId column (nullable) to', tableName);
      await qi.addColumn(tableName, 'publicId', { type: 'UUID', allowNull: true });
    } else {
      console.log('publicId already exists on', tableName);
    }

    // populate null publicId rows
    const [results] = await sequelize.query(`SELECT id FROM "${tableName}" WHERE "publicId" IS NULL`);
    if (results.length) {
      console.log('Found', results.length, 'rows without publicId — populating...');
      for (const row of results) {
        const uuid = randomUUID();
        await sequelize.query(`UPDATE "${tableName}" SET "publicId" = '${uuid}' WHERE id = ${row.id}`);
      }
    } else {
      console.log('No rows need publicId');
    }

    // alter column to set NOT NULL
    console.log('Setting publicId NOT NULL and adding unique constraint');
    await sequelize.query(`ALTER TABLE "${tableName}" ALTER COLUMN "publicId" SET NOT NULL`);
    // add unique constraint name
    try {
      await sequelize.query(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${tableName}_publicId_unique" UNIQUE ("publicId")`);
    } catch (e) {
      console.log('Unique constraint may already exist:', e.message);
    }

    console.log('publicId fix complete');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('fix-publicid failed:', err);
    try { await sequelize.close(); } catch (_) {}
    process.exit(1);
  }
})();
