const appointmentService = require('../services/appointmentService2');
const { Patient } = require('../models');
const PDFDocument = require('pdfkit');
const logger = require('../config/logger');

module.exports = {
    async showPatientSchedule(req, res) {
        try {
            const { publicId } = req.params;
            
            // Try to find patient first
            const patient = await Patient.findOne({ where: { publicId } });
            
            let appointments = [];
            let patientName = '';

            if (patient) {
                patientName = patient.name;
                const batchId = req.query.batchId || req.query.created; // Support both for now, but prefer batchId
                appointments = await appointmentService.getAppointmentsByPatientPublicId(publicId, batchId);
            } else {
                return res.status(404).render('public/error', { message: 'Paciente no encontrado' });
            }

            res.render('public/schedule', {
                patientName,
                appointments,
                layout: 'layout-simple' // Use the simple layout
            });
        } catch (error) {
            logger.error('Error showing schedule:', error);
            res.status(500).render('public/error', { message: 'Error al cargar el horario' });
        }
    },

    async downloadSchedulePDF(req, res) {
        try {
            const { publicId } = req.params;
            const patient = await Patient.findOne({ where: { publicId } });
            
            if (!patient) {
                return res.status(404).send('Paciente no encontrado');
            }

            const batchId = req.query.batchId || req.query.created;
            logger.info(`[PDF] Generating PDF for publicId: ${publicId}, batchId: ${batchId}`);
            const appointments = await appointmentService.getAppointmentsByPatientPublicId(publicId, batchId);
            logger.info(`[PDF] Found ${appointments.length} appointments`);

            const doc = new PDFDocument();
            
            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Citas_${patient.name.replace(/\s+/g, '_')}.pdf`);

            doc.pipe(res);

            // Header
            doc.fontSize(20).text('Hospital del Adulto Mayor', { align: 'center' });
            doc.moveDown();
            doc.fontSize(16).text('Recordatorio de Citas', { align: 'center' });
            doc.moveDown();

            // Patient Info
            doc.fontSize(12).text(`Paciente: ${patient.name}`);
            doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`);
            doc.moveDown();

            // Table Header
            const tableTop = 200;
            const dateX = 50;
            const timeX = 200;
            const therapistX = 300;
            
            doc.font('Helvetica-Bold');
            doc.text('Fecha', dateX, tableTop);
            doc.text('Hora', timeX, tableTop);
            doc.text('Terapeuta', therapistX, tableTop);
            doc.font('Helvetica');

            // Draw line
            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            let y = tableTop + 30;

            appointments.forEach(app => {
                if (y > 700) {
                    doc.addPage();
                    y = 50;
                }
                
                doc.text(String(app.date), dateX, y);
                doc.text(String(app.time).substring(0, 5), timeX, y);
                doc.text(app.therapist ? app.therapist.name : 'Asignado', therapistX, y);
                
                y += 20;
            });

            if (appointments.length === 0) {
                doc.text('No se encontraron citas para esta fecha.', 50, y + 20, { align: 'center' });
            }

            // Footer
            doc.moveDown(2);
            doc.fontSize(10).text('Por favor llegue 10 minutos antes de su cita.', 50, y + 20, { align: 'center', width: 500 });

            doc.end();

        } catch (error) {
            logger.error('Error generating PDF:', error);
            if (!res.headersSent) {
                 res.status(500).send(`Error generando PDF: ${error.message} \n ${error.stack}`);
            }
        }
    }
};
