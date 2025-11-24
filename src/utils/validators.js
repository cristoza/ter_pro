export function validateAppointmentData(data) {
    const errors = [];

    if (!data.date) {
        errors.push("Date is required.");
    }

    if (!data.time) {
        errors.push("Time is required.");
    }

    if (!data.patientName) {
        errors.push("Patient name is required.");
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return { valid: true };
}

export function validateAppointmentId(id) {
    if (!id) {
        return { valid: false, error: "Appointment ID is required." };
    }

    if (typeof id !== 'string' || id.trim() === '') {
        return { valid: false, error: "Invalid Appointment ID." };
    }

    return { valid: true };
}