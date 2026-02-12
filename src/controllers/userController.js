const userService = require('../services/userService');
const { Therapist } = require('../models');

exports.getUsersPage = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    const therapists = await Therapist.findAll({
      order: [['name', 'ASC']]
    });
    
    res.render('admin/users', { 
      users,
      therapists,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (error) {
    console.error('Error loading users page:', error);
    res.status(500).send('Error loading users page');
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, role, therapistId } = req.body;

    // Validate required fields
    if (!username || !password || !role) {
      return res.redirect('/admin/users?error=' + encodeURIComponent('Username, password, and role are required'));
    }

    // Validate password length
    if (password.length < 6) {
      return res.redirect('/admin/users?error=' + encodeURIComponent('Password must be at least 6 characters'));
    }

    await userService.createUser({
      username,
      password,
      role,
      therapistId: therapistId || null
    });

    res.redirect('/admin/users?success=' + encodeURIComponent('User created successfully'));
  } catch (error) {
    console.error('Error creating user:', error);
    res.redirect('/admin/users?error=' + encodeURIComponent(error.message || 'Error creating user'));
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, password, role, therapistId } = req.body;

    await userService.updateUser(userId, {
      username,
      password,
      role,
      therapistId: therapistId || null
    });

    res.redirect('/admin/users?success=' + encodeURIComponent('User updated successfully'));
  } catch (error) {
    console.error('Error updating user:', error);
    res.redirect('/admin/users?error=' + encodeURIComponent(error.message || 'Error updating user'));
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await userService.deleteUser(userId);
    res.redirect('/admin/users?success=' + encodeURIComponent('User deleted successfully'));
  } catch (error) {
    console.error('Error deleting user:', error);
    res.redirect('/admin/users?error=' + encodeURIComponent(error.message || 'Error deleting user'));
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.redirect('/admin/users?error=' + encodeURIComponent('Password must be at least 6 characters'));
    }

    await userService.updatePassword(userId, newPassword);
    res.redirect('/admin/users?success=' + encodeURIComponent('Password updated successfully'));
  } catch (error) {
    console.error('Error updating password:', error);
    res.redirect('/admin/users?error=' + encodeURIComponent(error.message || 'Error updating password'));
  }
};
