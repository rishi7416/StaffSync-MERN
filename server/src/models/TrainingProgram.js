import mongoose from 'mongoose';

const trainingProgramSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  department: { type: String, required: true, trim: true },
  provider: { type: String, trim: true, default: '' },
  format: { type: String, enum: ['In person', 'Online', 'Hybrid'], default: 'In person' },
  location: { type: String, trim: true, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['Planned', 'In Progress', 'Completed'], default: 'Planned' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

trainingProgramSchema.pre('validate', function(next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'End date must be on or after start date');
  }
  next();
});

export default mongoose.model('TrainingProgram', trainingProgramSchema);
