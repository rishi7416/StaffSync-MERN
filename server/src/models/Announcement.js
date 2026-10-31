import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  body: { type: String, required: true, trim: true, maxlength: 5000 },
  category: { type: String, enum: ['News', 'Policy', 'Event'], default: 'News' },
  pinned: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Announcement', announcementSchema);
