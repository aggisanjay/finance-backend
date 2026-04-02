import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['viewer', 'analyst', 'admin'];
export const STATUSES = ['active', 'inactive'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ROLES,
        message: 'Role must be one of: ' + ROLES.join(', '),
      },
      default: 'viewer',
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: 'Status must be one of: ' + STATUSES.join(', '),
      },
      default: 'active',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        delete ret.isDeleted;
        return ret;
      },
    },
  }
);

// ── Indexes ──
userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });

// ── Pre-save: hash password ──
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance method: compare password ──
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Query middleware: exclude soft-deleted by default ──
userSchema.pre(/^find/, function (next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: { $ne: true } });
  next();
});

export const User = mongoose.model('User', userSchema);

