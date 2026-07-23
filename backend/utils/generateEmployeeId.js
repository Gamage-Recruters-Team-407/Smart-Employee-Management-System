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
    const allEmployees = await Employee.find({ employeeId: { $exists: true, $ne: null } }).select("employeeId");
    let maxSeed = 0;
    for (const emp of allEmployees) {
      if (emp.employeeId) {
        const match = emp.employeeId.match(/\d+$/);
        if (match) {
          const n = parseInt(match[0], 10);
          if (!isNaN(n) && n > maxSeed) maxSeed = n;
        }
      }
    }

    await Counter.findByIdAndUpdate(
      "employeeId",
      { $setOnInsert: { seq: maxSeed } },
      { upsert: true, returnDocument: 'after' }
    );
  }

  // Atomically increment and return the new sequence number
  let counter = await Counter.findByIdAndUpdate(
    "employeeId",
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );

  let seq = counter.seq;
  let candidate = `emp-${String(seq).padStart(3, "0")}`;

  // Ensure case-insensitive uniqueness against existing records
  while (await Employee.exists({ employeeId: { $regex: new RegExp(`^${candidate}$`, "i") } })) {
    counter = await Counter.findByIdAndUpdate(
      "employeeId",
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true }
    );
    seq = counter.seq;
    candidate = `emp-${String(seq).padStart(3, "0")}`;
  }

  return candidate;
};

export default generateEmployeeId;

