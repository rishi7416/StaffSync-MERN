import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: String, required: true },
  checkIn: { type: String, default: '' },
  checkOut: { type: String, default: '' },
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'Half-day'], default: 'Present' },
  note: { type: String, default: '' }
}, { timestamps: true });

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
export default mongoose.model('Attendance', attendanceSchema);
