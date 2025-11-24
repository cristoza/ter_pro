const { Client } = require('pg');

// Hardcoded dev credentials (matches src/config/db.js)
const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '200429',
};

const dbName = 'Fisiatria_BD';

async function createDatabase() {
  // connect to the default 'postgres' database to run CREATE DATABASE
  const client = new Client({ ...config, database: 'postgres' });
  try {
    await client.connect();
    // check if database exists
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rows.length > 0) {
      console.log(`Database "${dbName}" already exists.`);
    } else {
      // Create DB
      await client.query(`CREATE DATABASE \"${dbName}\"`);
      console.log(`Database "${dbName}" created.`);
    }
  } catch (err) {
    console.error('Error creating database:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

createDatabase();
