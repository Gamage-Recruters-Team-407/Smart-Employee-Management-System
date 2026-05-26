import mongoose from "mongoose";

/**
 * Counter — stores the last-used sequence number for each named counter.
 * Used by generateEmployeeId to atomically issue unique, sequential IDs
 * without race conditions under concurrent requests.
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // counter name, e.g. "employeeId"
  seq: { type: Number, default: 0 },
});

export default mongoose.model("Counter", counterSchema);
