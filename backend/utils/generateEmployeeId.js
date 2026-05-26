import Counter from "../models/Counter.js";
import Employee from "../models/Employee.js";

/**
 * Generates the next sequential employee ID in the format EMP-001, EMP-002, etc.
 *
 * Uses an atomic MongoDB findOneAndUpdate ($inc) on a Counter document so that
 * concurrent requests can never receive the same ID (fix for race condition #1).
 *
 * On very first call the counter is bootstrapped from the highest existing employee
 * number so that pre-existing records are not overwritten.
 *
 * @returns {Promise<string>} The next employee ID string (e.g. "EMP-005")
 */
const generateEmployeeId = async () => {
  // Bootstrap: if the counter doesn't exist yet, seed it from the DB so we
  // don't collide with IDs that were created before this counter existed.
  const existing = await Counter.findById("employeeId");
  if (!existing) {
    // Find the highest numeric suffix among all existing employee IDs
    const lastEmployee = await Employee.findOne({ employeeId: { $exists: true, $ne: null } })
      .sort({ createdAt: -1 })
      .select("employeeId");

    let seed = 0;
    if (lastEmployee?.employeeId) {
      const parts = lastEmployee.employeeId.split("-");
      const n = parseInt(parts[1], 10);
      if (!isNaN(n)) seed = n;
    }

    // Create the counter at the seeded value (upsert = safe if two requests race here)
    await Counter.findByIdAndUpdate(
      "employeeId",
      { $setOnInsert: { seq: seed } },
      { upsert: true, new: true }
    );
  }

  // Atomically increment and return the new sequence number
  const counter = await Counter.findByIdAndUpdate(
    "employeeId",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const padded = String(counter.seq).padStart(3, "0");
  return `EMP-${padded}`;
};

export default generateEmployeeId;

