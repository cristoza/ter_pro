const request = require('supertest');
const app = require('../src/app');
const Appointment = require('../src/models/appointment');

describe('Appointment API', () => {
    beforeEach(async () => {
        await Appointment.deleteMany({});
    });

    it('should create a new appointment', async () => {
        const appointmentData = {
            date: '2023-10-01',
            time: '10:00',
            patientName: 'John Doe',
            reason: 'Physical therapy session'
        };

        const response = await request(app)
            .post('/appointments')
            .send(appointmentData)
            .expect(201);

        expect(response.body).toHaveProperty('_id');
        expect(response.body.date).toBe(appointmentData.date);
        expect(response.body.time).toBe(appointmentData.time);
        expect(response.body.patientName).toBe(appointmentData.patientName);
        expect(response.body.reason).toBe(appointmentData.reason);
    });

    it('should list all appointments', async () => {
        await new Appointment({
            date: '2023-10-01',
            time: '10:00',
            patientName: 'John Doe',
            reason: 'Physical therapy session'
        }).save();

        const response = await request(app)
            .get('/appointments')
            .expect(200);

        expect(response.body.length).toBe(1);
        expect(response.body[0].patientName).toBe('John Doe');
    });
});