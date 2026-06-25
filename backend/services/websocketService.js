import { Server } from "socket.io";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

// Helper function to format time as HH:MM
const formatTime = (date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

let ioInstance = null;

export const initWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Adjust to match your frontend URL in production
      methods: ["GET", "POST"]
    }
  });

  ioInstance = io;

  io.on("connection", (socket) => {
    // Keep track of the active session document ID for this specific socket connection
    let currentAttendanceId = null;
    let currentEmployeeId = null;

    // Join admin room
    socket.on("join-admin", () => {
      socket.join("admin");
      console.log(`Admin socket joined: ${socket.id}`);
    });

    // Authenticate the user when they connect (and automatically mark their attendance check-in)
    socket.on("authenticate", async (data) => {
      try {
        const { employeeId, userId } = data || {};
        if (userId) {
          socket.join(`user-${userId.toString()}`);
          console.log(`User socket joined: user-${userId.toString()}`);
        }
        if (!employeeId) return;

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
        const lateThreshold = 9 * 60 + 30; // 9:30 AM

        // Find existing attendance or create a new one
        let attendance = await Attendance.findOne({ employee: employee._id, date: today });

        if (!attendance) {
          attendance = new Attendance({
            employee: employee._id,
            date: today,
            loginTime: now,
            checkInTime: timeString,
            status: totalMinutes > lateThreshold ? "Late" : "Present",
            onlineStatus: "Online",
            location: "Online",
            activityStatus: true
          });
        } else {
          attendance.activityStatus = true;
          // Reconnecting clears checkout/logout times since they are active again
          attendance.checkOutTime = null;
          attendance.logoutTime = null;

          // Automatically check in if they haven't checked in yet today
          if (!attendance.checkInTime) {
            attendance.checkInTime = timeString;
            attendance.status = totalMinutes > lateThreshold ? "Late" : "Present";
          }

          // Preserve break status if they are currently on break, otherwise set to Online
          const isOnBreak = attendance.breakType && attendance.onlineStatus !== "Online";
          if (!isOnBreak) {
            attendance.onlineStatus = "Online";
          }
        }
        await attendance.save();

        currentAttendanceId = attendance._id;
        currentEmployeeId = employeeId;
        socket.join(`employee-${employeeId}`);

        console.log(`Employee ${employeeId} authenticated & attendance marked. Status: ${attendance.status}, Online status: ${attendance.onlineStatus}`);

        // Notify frontend that they are authenticated
        socket.emit("authenticated", {
          attendanceId: attendance._id,
          isAttendanceMarked: !!attendance.checkInTime,
          checkInTime: attendance.checkInTime,
          status: attendance.status,
          onlineStatus: attendance.onlineStatus
        });

        // Broadcast to admin room so the dashboard shows the employee as Online/On-Break instantly
        io.to("admin").emit("attendance-update", {
          employeeId,
          onlineStatus: attendance.onlineStatus,
          status: attendance.status,
          checkInTime: attendance.checkInTime || null,
          checkOutTime: attendance.checkOutTime || null
        });

      } catch (error) {
        console.error("Error during authentication & check-in:", error);
      }
    });

    // Handle break started event
    socket.on("break-started", async (data) => {
      try {
        const { employeeId, breakType, breakLabel, remainingSeconds } = data;
        console.log(`Break started for employee ${employeeId}: ${breakLabel}`);

        // Broadcast to admin room
        io.to("admin").emit("attendance-update", {
          employeeId,
          onlineStatus: breakLabel,
          breakType,
          remainingSeconds
        });
      } catch (error) {
        console.error("Error processing break-started event:", error);
      }
    });

    // Handle break ended event
    socket.on("break-ended", async (data) => {
      try {
        const { employeeId } = data;
        console.log(`Break ended for employee ${employeeId}`);

        // Broadcast to admin room
        io.to("admin").emit("attendance-update", {
          employeeId,
          onlineStatus: "Online",
          breakType: null,
          remainingSeconds: 0
        });
      } catch (error) {
        console.error("Error processing break-ended event:", error);
      }
    });

    // Native disconnect event triggers instantly when the tab is closed or connection drops
    socket.on("disconnect", async () => {
      console.log(`Client disconnected: ${socket.id}`);

      if (currentAttendanceId) {
        try {
          const now = new Date();
          const timeString = formatTime(now);

          // Mark checkout time and logout time on disconnect
          const updated = await Attendance.findByIdAndUpdate(currentAttendanceId, {
            $set: {
              activityStatus: false,
              onlineStatus: "Offline",
              checkOutTime: timeString,
              logoutTime: now
            }
          }, { returnDocument: 'after' });

          console.log(`Employee ${currentEmployeeId} disconnected. Offline. Leave time marked: ${timeString}`);

          // Broadcast to admin room
          io.to("admin").emit("attendance-update", {
            employeeId: currentEmployeeId,
            onlineStatus: "Offline",
            checkOutTime: timeString
          });
        } catch (error) {
          console.error("Error updating offline status:", error);
        }
      }
    });
  });

  return io;
};

export const notifyUserBadges = (userId) => {
  if (ioInstance && userId) {
    console.log(`🔔 Emitting badge-update to user-${userId.toString()}`);
    ioInstance.to(`user-${userId.toString()}`).emit("badge-update");
  }
};