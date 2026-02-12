// Script to seed machines
const { Machine, sequelize } = require('../src/models'); // Note: if models are exporting individual files, this might be wrong, but we checked models/index.js earlier so this should export sequelize? No, models/index usually exports models. db.js exports sequelize.
const { connectDB, sequelize: dbSequelize } = require('../src/config/db');

async function seedMachines() {
  await connectDB();
  // Sync schema to create tables. Using alter: true to update existing tables without dropping data
  await dbSequelize.sync({ alter: true }); 

  // Create 5 generic treatment cubicles
  const machines = [
    { name: 'Cubículo 1', type: 'General', status: 'active' },
    { name: 'Cubículo 2', type: 'General', status: 'active' },
    { name: 'Cubículo 3', type: 'General', status: 'active' },
    { name: 'Cubículo 4', type: 'General', status: 'active' },
    { name: 'Cubículo 5', type: 'General', status: 'active' },
    { name: 'Gimnasio A', type: 'Gym', status: 'active' },
    { name: 'Gimnasio B', type: 'Gym', status: 'active' },
  ];

  for (const m of machines) {
    await Machine.findOrCreate({
      where: { name: m.name },
      defaults: m
    });
  }
  
  console.log('Machines seeded!');
}

seedMachines().then(() => process.exit());
