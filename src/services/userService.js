const bcrypt = require('bcrypt');
const { User, Therapist } = require('../models');
const logger = require('../config/logger');

class UserService {
  /**
   * Get all users
   */
  async getAllUsers() {
    try {
      const users = await User.findAll({
        include: [
          {
            model: Therapist,
            as: 'therapist',
            attributes: ['id', 'name']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      return users;
    } catch (error) {
      logger.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Therapist,
            as: 'therapist',
            attributes: ['id', 'name']
          }
        ]
      });
      return user;
    } catch (error) {
      logger.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData) {
    try {
      const { username, password, role, therapistId } = userData;

      // Check if username already exists
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Validate role
      const validRoles = ['admin', 'doctor', 'therapist', 'secretary'];
      if (!validRoles.includes(role)) {
        throw new Error('Invalid role');
      }

      // If role is therapist, validate therapistId
      if (role === 'therapist') {
        if (!therapistId) {
          throw new Error('Therapist ID is required for therapist role');
        }
        const therapist = await Therapist.findByPk(therapistId);
        if (!therapist) {
          throw new Error('Therapist not found');
        }
        // Check if therapist already has a user account
        const existingTherapistUser = await User.findOne({ where: { therapistId } });
        if (existingTherapistUser) {
          throw new Error('This therapist already has a user account');
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        username,
        password: hashedPassword,
        role,
        therapistId: role === 'therapist' ? therapistId : null
      });

      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user details
   */
  async updateUser(userId, updateData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const { username, password, role, therapistId } = updateData;

      // Check username uniqueness if changed
      if (username && username !== user.username) {
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
          throw new Error('Username already exists');
        }
        user.username = username;
      }

      // Update role
      if (role) {
        const validRoles = ['admin', 'doctor', 'therapist', 'secretary'];
        if (!validRoles.includes(role)) {
          throw new Error('Invalid role');
        }
        user.role = role;
      }

      // Update therapistId
      if (role === 'therapist' || (role === undefined && user.role === 'therapist')) {
        // If role is changing to therapist OR role is staying therapist
        const targetTherapistId = therapistId || user.therapistId;
        
        if (!targetTherapistId) {
           // If we are updating to therapist role but no ID provided, or keeping therapist role but clearing ID
           if (role === 'therapist') throw new Error('Therapist ID is required for therapist role');
        } else {
           // Validate therapist exists
           const therapist = await Therapist.findByPk(targetTherapistId);
           if (!therapist) {
             throw new Error('Therapist not found');
           }
           // Check if therapist already has a user account (excluding this user)
           const existingTherapistUser = await User.findOne({ 
             where: { 
               therapistId: targetTherapistId,
               id: { [require('sequelize').Op.ne]: userId }
             } 
           });
           if (existingTherapistUser) {
             throw new Error('This therapist already has a user account');
           }
           user.therapistId = targetTherapistId;
        }
      } else if (role && role !== 'therapist') {
        // If role is changing to non-therapist, clear therapistId
        user.therapistId = null;
      }

      // Update password if provided
      if (password && password.trim() !== '') {
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
      }

      await user.save();
      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Prevent deleting the default admin
      if (user.username === 'admin') {
        throw new Error('Cannot delete the default admin user');
      }

      await user.destroy();
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId, newPassword) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      logger.error('Error updating password:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
