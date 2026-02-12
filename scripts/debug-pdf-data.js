const { Appointment, Patient } = require('../src/models');
const { sequelize } = require('../src/config/db');

(async () => {
    try {
        console.log('--- checking data consistency ---');
        // Get a patient
        const patient = await Patient.findOne();
        if(!patient) {
            console.log('No patients found');
            return;
        }
        console.log(`Patient: ${patient.name} (ID: ${patient.id}, PublicID: ${patient.publicId})`);

        // Get appointments for this patient using patientId
        const byId = await Appointment.findAll({ where: { patientId: patient.id } });
        console.log(`Appointments found by patientId (${patient.id}): ${byId.length}`);
        
        if (byId.length > 0) {
            console.log(`First appointment patientPublicId column: ${byId[0].patientPublicId}`);
            if (byId[0].patientPublicId !== patient.publicId) {
                console.error('MISMATCH/NULL: Appointment.patientPublicId does not match Patient.publicId');
            }
        }

        // Get appointments using the service logic (by patientPublicId column)
        const byPublicId = await Appointment.findAll({ where: { patientPublicId: patient.publicId } });
        console.log(`Appointments found by patientPublicId (${patient.publicId}): ${byPublicId.length}`);

    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
})();
