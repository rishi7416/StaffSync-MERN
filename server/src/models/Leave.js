import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType: { type: String, enum: ['Casual', 'Sick', 'Earned', 'Unpaid', 'Other'], default: 'Casual' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewNote: { type: String, default: '' }
}, { timestamps: true });

leaveSchema.pre('validate', function(next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'End date must be on or after start date');
  }
  next();
});

export default mongoose.model('Leave', leaveSchema);
