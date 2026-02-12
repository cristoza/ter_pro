// Authentication middleware

// Check if user is logged in
function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        if (req.originalUrl.startsWith('/api') || req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
             return res.status(401).json({ message: 'Unauthorized' });
        }
        return res.redirect('/login');
    }
    next();
}

// Check if user has a specific role
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.session || !req.session.userId) {
            if (req.originalUrl.startsWith('/api') || req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
                 return res.status(401).json({ message: 'Unauthorized' });
            }
            return res.redirect('/login');
        }
        const userRole = req.session.userRole;
        if (!roles.includes(userRole)) {
            // Debug log unauthorized access attempts for troubleshooting
            console.warn(`[AUTH] 403 denied for role="${userRole}" (type: ${typeof userRole}, len: ${userRole?.length}) on ${req.method} ${req.originalUrl}`);
            console.warn(`[AUTH] Required roles: ${JSON.stringify(roles)}`);
            
            if (req.originalUrl.startsWith('/api') || req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
                 return res.status(403).json({ message: 'Forbidden' });
            }
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
