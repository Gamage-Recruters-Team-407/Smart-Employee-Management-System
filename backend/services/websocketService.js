import { Server } from "socket.io";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

const TIMEZONE = process.env.APP_TIMEZONE || process.env.BREAK_TIMEZONE || "Asia/Colombo";

const getZonedParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);

  const hours = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minutes = Number(parts.find((p) => p.type === "minute")?.value || 0);
  return { hours, minutes };
};

const formatTime = (date = new Date()) => {
  const { hours, minutes } = getZonedParts(date);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const getZonedDateString = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

let ioInstance = null;

export const initWebSocket = (server) => {
  const isVercel = !!process.env.VERCEL;

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    // On Vercel, only websocket transport is supported (no long-polling)
    ...(isVercel && { transports: ["websocket"] }),
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

        const now = new Date();
        const today = getZonedDateString(now);
        const timeString = formatTime(now);
        const { hours, minutes } = getZonedParts(now);
        const totalMinutes = hours * 60 + minutes;
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