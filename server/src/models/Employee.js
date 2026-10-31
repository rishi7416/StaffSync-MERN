import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true, trim: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true, default: '' },
  department: { type: String, required: true, trim: true },
  position: { type: String, required: true, trim: true },
  employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Intern'], default: 'Full-time' },
  salary: { type: Number, min: 0, default: 0 },
  joiningDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' }
}, { timestamps: true });

employeeSchema.index({ name: 'text', email: 'text', employeeId: 'text', department: 'text' });
export default mongoose.model('Employee', employeeSchema);
