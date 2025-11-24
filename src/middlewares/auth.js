// Authentication middleware

// Check if user is logged in
function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }
    next();
}

// Check if user has a specific role
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.session || !req.session.userId) {
            return res.redirect('/login');
        }
        if (!roles.includes(req.session.userRole)) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
}

// Redirect to appropriate dashboard based on role
function redirectToDashboard(req, res) {
    const role = req.session.userRole;
    if (role === 'admin') {
        return res.redirect('/admin');
    } else if (role === 'doctor') {
        return res.redirect('/doctor');
    } else if (role === 'therapist') {
        return res.redirect('/therapist');
    }
    return res.redirect('/');
}

module.exports = {
    requireAuth,
    requireRole,
    redirectToDashboard,
};
