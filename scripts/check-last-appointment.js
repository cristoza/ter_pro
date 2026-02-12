const { Appointment } = require('../src/models');
const { sequelize } = require('../src/config/db');

(async () => {
  try {
    const lastApp = await Appointment.findOne({
      order: [['createdAt', 'DESC']]
    });
    
    if (lastApp) {
      console.log('Last Appointment:', {
        id: lastApp.id,
        patientName: lastApp.patientName,
        patientPublicId: lastApp.patientPublicId,
        createdAt: lastApp.createdAt
      });
    } else {
      console.log('No appointments found.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
})();
