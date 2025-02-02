const { randomUUID } = require('crypto');

const User = require('../models/User.js');
const { generatePasswordHash, validatePassword } = require('../utils/password.js');

class UserService {
  static async list() {
    try {
      return User.find();
    } catch (err) {
      throw new Error(`Database error while listing users: ${err}`);
    }
  }

  static async get(id) {
    try {
      const user = await User.findOne({ _id: id }).exec();
      console.log('UserService.get:', {
        userId: id,
        userObjSize: JSON.stringify(user).length,
        refreshTokenSize: user.refreshToken?.length
      });
      return user;
    } catch (err) {
      throw new Error(`Database error while getting the user by their ID: ${err}`);
    }
  }

  static async getByEmail(email) {
    try {
      return User.findOne({ email }).exec();
    } catch (err) {
      throw new Error(`Database error while getting the user by their email: ${err}`);
    }
  }

  static async update(id, data) {
    try {
      return User.findOneAndUpdate({ _id: id }, data, { new: true, upsert: false });
    } catch (err) {
      throw new Error(`Database error while updating user ${id}: ${err}`);
    }
  }

  static async delete(id) {
    try {
      const result = await User.deleteOne({ _id: id }).exec();
      return (result.deletedCount === 1);
    } catch (err) {
      throw new Error(`Database error while deleting user ${id}: ${err}`);
    }
  }

  static async authenticateWithPassword(email, password) {
    try {
      console.log('UserService.authenticateWithPassword called:', { email });
      
      if (!email) throw new Error('Email is required');
      if (!password) throw new Error('Password is required');

      try {
        const user = await User.findOne({email}).exec();
        console.log('User lookup result:', {
          userFound: !!user,
          userType: user ? typeof user : null,
          userMethods: user ? Object.keys(user.__proto__) : [],
        });

        if (!user) return null;

        console.log('Validating password');
        const passwordValid = await validatePassword(password, user.password);
        console.log('Password validation result:', { passwordValid });
        
        if (!passwordValid) return null;

        user.lastLoginAt = Date.now();
        console.log('Saving updated login time');
        const updatedUser = await user.save();
        console.log('User updated successfully');
        
        return updatedUser;
      } catch (dbError) {
        console.error('Database error in authenticateWithPassword:', dbError);
        throw dbError;
      }
    } catch (error) {
      console.error('Authentication error:', {
        error,
        stack: error.stack
      });
      throw error;
    }
  }

  static async create({ email, password, name = '' }) {
    if (!email) throw new Error('Email is required');
    if (!password) throw new Error('Password is required');

    const existingUser = await UserService.getByEmail(email);
    if (existingUser) throw new Error('User with this email already exists');

    const hash = await generatePasswordHash(password);

    try {
      const user = new User({
        email,
        password: hash,
        name,
      });

      await user.save();
      return user;
    } catch (err) {
      throw new Error(`Database error while creating new user: ${err}`);
    }
  }

  static async setPassword(user, password) {
    if (!password) throw new Error('Password is required');
    user.password = await generatePasswordHash(password); // eslint-disable-line

    try {
      if (!user.isNew) {
        await user.save();
      }

      return user;
    } catch (err) {
      throw new Error(`Database error while setting user password: ${err}`);
    }
  }
}

module.exports = UserService;
