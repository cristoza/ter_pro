const bcrypt = require('bcrypt');
const { User } = require('../models');

module.exports = {
    // Show login page
    showLogin(req, res) {
        if (req.session && req.session.userId) {
            // Already logged in, redirect to dashboard
            const role = req.session.userRole;
            if (role === 'admin') return res.redirect('/admin');
            if (role === 'doctor') return res.redirect('/doctor');
            if (role === 'therapist') return res.redirect('/therapist');
            if (role === 'secretary') return res.redirect('/secretary');
        }
        res.render('login', { error: null });
    },

    // Handle login
    async login(req, res) {
        try {
            const { username, password } = req.body;

            // Find user
            const user = await User.findOne({ where: { username } });
            if (!user) {
                return res.render('login', { error: 'Invalid username or password' });
            }

            // Check password
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return res.render('login', { error: 'Invalid username or password' });
            }

            // Set session
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.userRole = user.role;
            req.session.therapistId = user.therapistId;

            // Redirect based on role
            if (user.role === 'admin') {
                return res.redirect('/admin');
            } else if (user.role === 'doctor') {
                return res.redirect('/doctor');
            } else if (user.role === 'therapist') {
                return res.redirect('/therapist');
            } else if (user.role === 'secretary') {
                return res.redirect('/secretary');
            }
        } catch (error) {
            console.error('Login error:', error);
            res.render('login', { error: 'An error occurred. Please try again.' });
        }
    },

    // Handle API login
    async apiLogin(req, res) {
        try {
            const { username, password } = req.body;

            // Find user
            const user = await User.findOne({ where: { username } });
            if (!user) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Check password
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Set session
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.userRole = user.role;
            req.session.therapistId = user.therapistId;

            // Return user info
            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    therapistId: user.therapistId
                }
            });
        } catch (error) {
            console.error('API Login error:', error);
            res.status(500).json({ error: 'An error occurred' });
        }
    },

    // Handle logout
    logout(req, res) {
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Logout error:', err);
                    return res.status(500).send('Error logging out');
                }
                res.clearCookie('connect.sid');
                res.redirect('/login');
            });
        } else {
            res.redirect('/login');
        }
    },
};
