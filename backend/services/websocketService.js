import { Server } from "socket.io";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

// Helper function to format time as HH:MM
const formatTime = (date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

export const initWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Adjust to match your frontend URL in production
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {    
    // Keep track of the active session document ID for this specific socket connection
    let currentAttendanceId = null;
    let currentEmployeeId = null;

    // Authenticate the user when they connect
    socket.on("authenticate", async (data) => {
      try {
        const { employeeId } = data;
        // Optimize query by only selecting the '_id' field
        const employee = await Employee.findOne({ employeeId }).select("_id");
        
        if (!employee) {
          socket.emit("error", { message: "Employee not found" });
          return;
        }

        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const timeString = formatTime(now);
        const totalMinutes = now.getHours() * 60 + now.getMinutes();
        
        // Atomic Upsert: Combines find & create/update into a single DB query
        let attendance = await Attendance.findOneAndUpdate(
          { employee: employee._id, date: today },
          {
            $set: { activityStatus: true },
            $setOnInsert: {
              loginTime: now,
              checkInTime: timeString,
              status: totalMinutes > 9 * 60 + 30 ? "Late" : "Present",
              location: "Online"
            }
          },
          { returnDocument: "after", upsert: true }
        );

        // Handle edge case if it was manually created earlier without a checkInTime
        if (!attendance.checkInTime) {
          console.log(`New client connected: ${socket.id}`);
          attendance.checkInTime = timeString;
          attendance.loginTime = now;
          await attendance.save();
          console.log(`Employee ${employeeId} checked-in at ${attendance.checkInTime}.`);
        }

        currentAttendanceId = attendance._id;
        currentEmployeeId = employeeId;
        
        console.log(`Employee ${employeeId} reloadeded page at ${timeString} and also checked-in at ${attendance.checkInTime}`);

      } catch (error) {
        console.error("Error during authentication:", error);
      }
    });

    // Native disconnect event triggers instantly when the tab is closed or connection drops
    socket.on("disconnect", async () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      if (currentAttendanceId) {
        try {
          const now = new Date();
          const timeString = formatTime(now);

          // Direct update to save a DB round-trip (no need to fetch first)
          await Attendance.findByIdAndUpdate(currentAttendanceId, {
            $set: {
              logoutTime: now,
              checkOutTime: timeString,
              activityStatus: false
            }
          });
          
          console.log(`Employee ${currentEmployeeId} checked-out at ${timeString}.`);
        } catch (error) {
          console.error("Error updating offline status:", error);
        }
      }
    });
  });

  return io;
};