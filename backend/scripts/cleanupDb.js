import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

// Find admin users to keep
const adminUsers = await db.collection('users').find({ role: 'Admin' }).toArray();
console.log('Admin users kept:', adminUsers.map(u => u.email));

// Delete non-admin users
const delUsers = await db.collection('users').deleteMany({ role: { $ne: 'Admin' } });
console.log('Deleted users:', delUsers.deletedCount);

// Delete non-admin employees
const adminIds = adminUsers.map(u => u._id);
const delEmp = await db.collection('employees').deleteMany({ userId: { $nin: adminIds } });
console.log('Deleted employees:', delEmp.deletedCount);

// Clear attendance records
const delAtt = await db.collection('attendances').deleteMany({});
console.log('Deleted attendances:', delAtt.deletedCount);

// Reset counters
const delCounters = await db.collection('counters').deleteMany({});
console.log('Reset counters:', delCounters.deletedCount);

await mongoose.disconnect();
console.log('Done!');
