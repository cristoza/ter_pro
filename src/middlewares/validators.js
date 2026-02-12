/**
 * Input validation middleware for appointment operations
 */

const validators = {
  /**
   * Validate appointment creation data
   */
  validateAppointmentCreate: (req, res, next) => {
    const { patientName, patientCedula, durationMinutes } = req.body;
    const errors = [];

    // Patient name or cedula required
    if (!patientName && !patientCedula) {
      errors.push('Either patientName or patientCedula is required');
    }

    // Validate patient name if provided
    if (patientName && (typeof patientName !== 'string' || patientName.trim().length === 0)) {
      errors.push('Patient name must be a non-empty string');
    }

    // Validate cedula if provided
    if (patientCedula) {
      const cedulaStr = String(patientCedula).trim();
      if (!/^\d{10}$/.test(cedulaStr)) {
        errors.push('Cedula must be exactly 10 digits');
      }
    }

    // Validate duration if provided
    if (durationMinutes !== undefined) {
      const dur = Number(durationMinutes);
      if (isNaN(dur) || dur < 15 || dur > 180) {
        errors.push('Duration must be between 15 and 180 minutes');
      }
    }

    // Validate date format if provided (check both 'date' and 'startDate' for series)
    const dateField = req.body.date || req.body.startDate;
    if (dateField && !/^\d{4}-\d{2}-\d{2}$/.test(dateField)) {
      errors.push('Date must be in YYYY-MM-DD format');
    }

    // Validate time format if provided
    if (req.body.time) {
      const timeStr = String(req.body.time).trim();
      if (!/^\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(timeStr)) {
        errors.push('Time must be in HH:MM or HH:MM:SS format');
      }
    }

    // Validate occurrences if provided (for series)
    if (req.body.occurrences !== undefined) {
      const occ = Number(req.body.occurrences);
      if (isNaN(occ) || occ < 1 || occ > 50) {
        errors.push('Occurrences must be between 1 and 50');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    next();
  },

  /**
   * Validate user creation data
   */
  validateUserCreate: (req, res, next) => {
    const { username, password, role } = req.body;
    const errors = [];

    // Validate username
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (username && !/^[a-zA-Z0-9._-]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, dots, underscores, and hyphens');
    }

    // Validate password
    if (!password || typeof password !== 'string' || password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    // Validate role
    const validRoles = ['admin', 'doctor', 'therapist', 'secretary'];
    if (!role || !validRoles.includes(role)) {
      errors.push(`Role must be one of: ${validRoles.join(', ')}`);
    }

    // If role is therapist, therapistId is required
    if (role === 'therapist' && !req.body.therapistId) {
      errors.push('Therapist ID is required when role is therapist');
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    next();
  },

  /**
   * Validate patient creation data
   */
  validatePatientCreate: (req, res, next) => {
    const { name, cedula } = req.body;
    const errors = [];

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Patient name is required');
    }

    // Validate cedula
    if (!cedula) {
      errors.push('Cedula is required');
    } else {
      const cedulaStr = String(cedula).trim();
      if (!/^\d{10}$/.test(cedulaStr)) {
        errors.push('Cedula must be exactly 10 digits');
      }
    }

    // Validate date of birth if provided
    if (req.body.dob && !/^\d{4}-\d{2}-\d{2}$/.test(req.body.dob)) {
      errors.push('Date of birth must be in YYYY-MM-DD format');
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    next();
  },

  /**
   * Validate therapist creation data
   */
  validateTherapistCreate: (req, res, next) => {
    const { name, email, password } = req.body;
    const errors = [];

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Therapist name is required');
    }

    // Validate email (only if provided)
    if (email && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      errors.push('Valid email address is required if provided');
    }

    // Validate password
    if (!password || typeof password !== 'string' || password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    next();
  },

  /**
   * Validate availability data
   */
  validateAvailability: (req, res, next) => {
    const { therapistId, dayOfWeek, startTime, endTime } = req.body;
    const errors = [];

    // Validate therapistId
    if (!therapistId || isNaN(Number(therapistId))) {
      errors.push('Valid therapist ID is required');
    }

    // Validate dayOfWeek
    const dow = Number(dayOfWeek);
    if (dayOfWeek === undefined || isNaN(dow) || dow < 0 || dow > 6) {
      errors.push('Day of week must be between 0 (Sunday) and 6 (Saturday)');
    }

    // Validate time format
    if (!startTime || !/^\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(String(startTime).trim())) {
      errors.push('Start time must be in HH:MM or HH:MM:SS format');
    }

    if (!endTime || !/^\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(String(endTime).trim())) {
      errors.push('End time must be in HH:MM or HH:MM:SS format');
    }

    // Validate that end time is after start time
    if (startTime && endTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      if (sh * 60 + sm >= eh * 60 + em) {
        errors.push('End time must be after start time');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    next();
  },
};

module.exports = validators;
