const Attendance = require('../models/Attendance');

module.exports = (io) => {
  const attendanceNamespace = io.of('/attendance');

  attendanceNamespace.on('connection', (socket) => {
    console.log('Attendance socket connected:', socket.id);

    // Join employee room
    socket.on('join-employee', (employeeId) => {
      socket.join(`employee-${employeeId}`);
      console.log(`Employee ${employeeId} joined room`);
    });

    // Join admin room
    socket.on('join-admin', () => {
      socket.join('admin');
      console.log('Admin joined room');
    });

    // Handle break start
    socket.on('break-started', async (data) => {
      const { employeeId, breakType, breakLabel, remainingSeconds } = data;
      
      // Broadcast to admin room
      socket.to('admin').emit('attendance-update', {
        employeeId,
        onlineStatus: breakLabel,
        breakType,
        remainingSeconds
      });
    });

    // Handle break end
    socket.on('break-ended', async (employeeId) => {
      socket.to('admin').emit('attendance-update', {
        employeeId,
        onlineStatus: 'Online',
        breakType: null,
        remainingSeconds: 0
      });
    });

    // Handle status update
    socket.on('status-update', async (data) => {
      const { employeeId, onlineStatus, breakType } = data;
      
      socket.to('admin').emit('attendance-update', {
        employeeId,
        onlineStatus,
        breakType
      });
    });

    socket.on('disconnect', () => {
      console.log('Attendance socket disconnected:', socket.id);
    });
  });
};