const { Therapist } = require('../src/models');
const { sequelize } = require('../src/config/db');

async function updateTherapists() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Update all therapists to have specialty 'Físico' if it is null or empty
    // Since the user said "update for all the therapist right now to be fisical", 
    // I will force update all of them to be sure, or maybe just those that are not set.
    // Given the previous migration set a default, they might be 'Físico' already, 
    // but let's run an update to be 100% sure as requested.
    
    const [updated] = await Therapist.update({ specialty: 'Físico' }, {
      where: {} // Update all
    });

    console.log(`Updated ${updated} therapists to specialty 'Físico'.`);

  } catch (error) {
    console.error('Error updating therapists:', error);
  } finally {
    await sequelize.close();
  }
}

updateTherapists();
