const path = require('path');
// Load the app's DB and models
const { connectDB, sequelize } = require(path.join(__dirname, '..', 'src', 'config', 'db'));
const { Therapist, Patient, TherapistAvailability, Appointment } = require(path.join(__dirname, '..', 'src', 'models'));

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function seed() {
  try {
  await connectDB();

    console.log('Clearing existing data (if any)...');
    // clear tables in order to respect FKs
    await Appointment.destroy({ where: {}, truncate: true, cascade: true });
    await TherapistAvailability.destroy({ where: {}, truncate: true, cascade: true });
    await Patient.destroy({ where: {}, truncate: true, cascade: true });
    await Therapist.destroy({ where: {}, truncate: true, cascade: true });

    console.log('Creating therapists...');
    const therapists = await Therapist.bulkCreate([
      { name: 'Ana Morales', email: 'ana@example.com', password: 'pass', phone: '555-0101' },
      { name: 'Carlos Vega', email: 'carlos@example.com', password: 'pass', phone: '555-0102' },
      { name: 'María Ruiz', email: 'maria@example.com', password: 'pass', phone: '555-0103' },
    ], { returning: true });

    console.log('Creating patients...');
    const patients = await Patient.bulkCreate([
      { cedula: '1712345678', name: 'Juan Perez', dob: '1985-06-12', contact: 'juan@example.com', notes: 'Knee pain' },
      { cedula: '0908765432', name: 'Laura Gómez', dob: '1990-11-02', contact: 'laura@example.com', notes: 'Post-surgery rehab' },
      { cedula: '0102030405', name: 'Luis Fernández', dob: '1978-03-22', contact: 'luis@example.com', notes: '' },
    ], { returning: true });

    console.log('Creating weekly availability (Mon-Fri 09:00-17:00) for each therapist...');
    const availabilities = [];
    for (const t of therapists) {
      for (let dow = 1; dow <= 5; dow++) { // 1=Monday .. 5=Friday
        availabilities.push({ therapistId: t.id, dayOfWeek: dow, startTime: '09:00:00', endTime: '17:00:00' });
      }
    }
    await TherapistAvailability.bulkCreate(availabilities);

    console.log('Creating example appointments for the next 6 business days...');
    const today = new Date();
    const appointments = [];
    // create appointments over the next 6 days (skip weekends)
    let added = 0;
    let dateCursor = new Date(today);
    while (added < 6) {
      const dow = dateCursor.getDay();
      if (dow !== 0 && dow !== 6) { // skip Sunday(0) and Saturday(6)
        // rotate therapists and patients for variety
        const therapist = therapists[added % therapists.length];
        const patient = patients[added % patients.length];
        const dateStr = formatDate(dateCursor);
        const hour = 9 + (added % 6); // 9:00 to 14:00
        const timeStr = String(hour).padStart(2, '0') + ':00:00';
        appointments.push({ date: dateStr, time: timeStr, durationMinutes: 45, patientName: patient.name, patientContact: patient.contact, therapistId: therapist.id });
        added++;
      }
      dateCursor.setDate(dateCursor.getDate() + 1);
    }
    await Appointment.bulkCreate(appointments);

    const tCount = await Therapist.count();
    const pCount = await Patient.count();
    const aCount = await Appointment.count();
    const avCount = await TherapistAvailability.count();

    console.log(`Seed complete: therapists=${tCount}, patients=${pCount}, appointments=${aCount}, availabilities=${avCount}`);
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    try { await sequelize.close(); } catch (_) {}
    process.exit(1);
  }
}

seed();
