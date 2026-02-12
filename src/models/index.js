// Export Sequelize-backed models (CommonJS)
const Appointment = require('./appointment');
const Therapist = require('./therapist');
const Patient = require('./patient');
const TherapistAvailability = require('./therapistAvailability');
const User = require('./user');
const Machine = require('./machine');

// Define associations
Appointment.belongsTo(Therapist, { foreignKey: 'therapistId', as: 'therapist' });
Therapist.hasMany(Appointment, { foreignKey: 'therapistId', as: 'appointments' });

Appointment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Patient.hasMany(Appointment, { foreignKey: 'patientId', as: 'appointments' });

Appointment.belongsTo(Machine, { foreignKey: 'machineId', as: 'machine' });
Machine.hasMany(Appointment, { foreignKey: 'machineId', as: 'appointments' });

TherapistAvailability.belongsTo(Therapist, { foreignKey: 'therapistId', as: 'therapist' });
Therapist.hasMany(TherapistAvailability, { foreignKey: 'therapistId', as: 'availability' });

User.belongsTo(Therapist, { foreignKey: 'therapistId', as: 'therapist' });
Therapist.hasOne(User, { foreignKey: 'therapistId', as: 'user' });

module.exports = {
	Appointment,
	Therapist,
	Patient,
	TherapistAvailability,
	User,
    Machine
};