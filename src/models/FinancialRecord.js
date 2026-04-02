import mongoose from 'mongoose';

export const RECORD_TYPES = ['income', 'expense'];
export const CATEGORIES = [
  'salary',
  'freelance',
  'investment',
  'food',
  'transport',
  'utilities',
  'entertainment',
  'healthcare',
  'education',
  'shopping',
  'rent',
  'insurance',
  'tax',
  'other',
];

const financialRecordSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: RECORD_TYPES,
        message: 'Type must be one of: ' + RECORD_TYPES.join(', '),
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: 'Category must be one of: ' + CATEGORIES.join(', '),
      },
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must be at most 500 characters'],
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator reference is required'],
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
        delete ret.__v;
        delete ret.isDeleted;
        return ret;
      },
    },
  }
);

// ── Indexes for fast querying ──
financialRecordSchema.index({ date: -1 });
financialRecordSchema.index({ type: 1, category: 1 });
financialRecordSchema.index({ createdBy: 1, date: -1 });

// ── Query middleware: exclude soft-deleted ──
financialRecordSchema.pre(/^find/, function (next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: { $ne: true } });
  next();
});

export const FinancialRecord = mongoose.model('FinancialRecord', financialRecordSchema);

