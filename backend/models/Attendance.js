import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: String, // format: YYYY-MM-DD
      // 💡 ස්වයංක්‍රීයවම අද දවස YYYY-MM-DD ලෙස ලබා දේ (HEAD එකෙන් සුරැකූ කොටස)
      default: () => new Date().toISOString().split('T')[0],
      required: true,
    },
    loginTime: Date,
    logoutTime: Date,
    checkInTime: String,  // format: HH:MM
    checkOutTime: String, // format: HH:MM
    status: {
      type: String,
      enum: ["Present", "Late", "Absent", "Half-Day", "Inactive"],
      default: "Present",
    },
    location: String,
    activityStatus: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ එකම සේවකයාට එකම දිනකදී දෙවතාවක් attendance logs සෑදීම වළක්වයි (Unique Compound Index)
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);