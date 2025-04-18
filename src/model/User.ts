import mongoose, { Schema, Document } from 'mongoose';

export interface User extends Document {
  username: string;
  email: string;
  password?: string; // Optional for social logins
  verifyCode?: string;
  verifyCodeExpiry?: Date | null;
  isVerified: boolean;
}

const UserSchema: Schema<User> = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/.+\@.+\..+/, 'Please use a valid email address'],
  },
  password: {
    type: String,
    required: function (this: User) {
      return !this.isVerified; // Password is only required if not verified (non-social)
    },
  },
  verifyCode: {
    type: String,
    required: function (this: User) {
      return !this.isVerified; // Only needed if not verified
    },
  },
  verifyCodeExpiry: {
    type: Date,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
});

// Check if model already exists to prevent overwrite issues during hot reloads
const UserModel =
  mongoose.models.User as mongoose.Model<User> || mongoose.model<User>('User', UserSchema);

export default UserModel;
