const userService = require('../services/userService');
const { Therapist } = require('../models');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('API Error getting users:', error);
    res.status(500).json({ message: 'Error retrieving users', error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    if (error.message === 'Username already exists') {
        return res.status(409).json({ message: error.message });
    }
    console.error('API Error creating user:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    console.error('API Error updating user:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('API Error deleting user:', error);
    res.status(500).json({ message: error.message });
  }
};
