const mongoose = require('mongoose');

const { validatePassword, isPasswordHash } = require('../utils/password.js');
const {randomUUID} = require("crypto");

// Check if the model already exists before defining it
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    validate: { validator: isPasswordHash, message: 'Invalid password hash' },
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  refreshToken: {
    type: String,
    unique: true,
    index: true,
    default: () => randomUUID(),
  },
}, {
  versionKey: false,
  toJSON: { virtuals: false },
  toObject: { virtuals: false }
}));

// Add methods to the existing model's prototype
if (!User.prototype.toAuthJSON) {
  User.prototype.toAuthJSON = function() {
    return {
      _id: this._id.toString(),
      email: this.email
    };
  };
}

// Override toObject if it hasn't been set
if (!User.prototype.toObject) {
  User.prototype.toObject = function() {
    return this.toAuthJSON();
  };
}

// Set toJSON transform if it hasn't been set
if (!User.schema.options.toJSON || !User.schema.options.toJSON.transform) {
  User.schema.set('toJSON', {
    transform: (doc, ret, options) => {
      return doc.toAuthJSON();
    }
  });
}

module.exports = User;
