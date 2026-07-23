import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  checkInTime: {
    type: String,
    default: null
  },
  checkOutTime: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half-Day', 'Not Marked'],
    default: 'Not Marked'
  },
  onlineStatus: {
    type: String,
    enum: ['Online', 'Offline', 'Breakfast', 'Lunch', 'Tea Time'],
    default: 'Offline'
  },
  breakType: {
    type: String,
    enum: ['breakfast', 'lunch', 'tea', null],
    default: null
  },
  breakStartTime: {
    type: Date,
    default: null
  },
  breakRemainingSeconds: {
    type: Number,
    default: 0
  },
  takenBreaks: {
    type: [String],
    default: []
  },
  location: {
    type: String,
    default: 'Office'
  },
  isOnLeave: {
    type: Boolean,
    default: false
  },
  leaveType: {
    type: String,
    default: null
  },
  workingHours: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for faster queries
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);