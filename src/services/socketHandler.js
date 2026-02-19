/**
 * Socket Event Handler
 * Handles real-time communication for secretaries and other users
 */

module.exports = function setupSocketHandlers(io) {
    // Add middleware to log handshake attempts
    io.use((socket, next) => {
        try {
            console.log(`[Socket] Handshake attempt from ${socket.id}`);
            console.log(`[Socket] Handshake origin:`, socket.handshake.headers.origin || socket.handshake.headers.referer || 'unknown');
            next();
        } catch (err) {
            console.error(`[Socket] Error in handshake middleware:`, err.message);
            next(new Error('Handshake error: ' + err.message));
        }
    });

    io.on('connection', (socket) => {
        try {
            console.log(`[Socket] User connected: ${socket.id}`);

            // When a user joins, they can specify their role
            socket.on('user:join', (data) => {
                try {
                    console.log(`[Socket] Received user:join event: ${JSON.stringify(data)}`);
                    
                    const { role, userId, username } = data;
                    
                    console.log(`[Socket] Processing join - role: ${role}, userId: ${userId}, username: ${username}`);

                    // Validate data
                    if (!role || !userId) {
                        console.error(`[Socket] Invalid user:join data - missing role or userId`, { role, userId });
                        socket.emit('error', { message: 'Invalid user data' });
                        return;
                    }

                    // Store user info in socket
                    socket.userId = userId;
                    socket.userRole = role;
                    socket.username = username;

                    console.log(`[Socket] User stored on socket: ${username} (${role})`);

                    // Add to role-specific room for targeted notifications
                    if (role === 'secretary') {
                        socket.join('secretaries');
                        console.log(`[Socket] Secretary ${username} added to "secretaries" room - socket.id: ${socket.id}`);
                        
                        // Notify other secretaries that a secretary is online
                        io.to('secretaries').emit('user:status:online', {
                            userId,
                            username,
                            role,
                            timestamp: new Date().toISOString()
                        });
                    } else if (role === 'therapist') {
                        socket.join('therapists');
                        console.log(`[Socket] Therapist ${username} added to "therapists" room`);
                    } else if (role === 'admin') {
                        socket.join('admins');
                        console.log(`[Socket] Admin ${username} added to "admins" room`);
                    } else if (role === 'doctor') {
                        socket.join('doctors');
                        console.log(`[Socket] Doctor ${username} added to "doctors" room`);
                    } else {
                        console.warn(`[Socket] Unknown role: ${role}`);
                    }
                } catch (err) {
                    console.error(`[Socket] Error in user:join handler:`, err.message);
                    socket.emit('error', { message: err.message });
                }
            });

            // Handle appointment status changes
            socket.on('appointment:status:change', (data) => {
                try {
                    const { appointmentId, status, userId } = data;
                    
                    console.log(`[Socket] Appointment ${appointmentId} status changed to ${status} by user ${userId}`);
                    
                    // Broadcast to all secretaries
                    io.to('secretaries').emit('appointment:status:changed', {
                        appointmentId,
                        status,
                        changedBy: socket.userRole,
                        timestamp: new Date().toISOString()
                    });
                } catch (err) {
                    console.error(`[Socket] Error in appointment:status:change:`, err.message);
                }
            });

            // Handle appointment assignment
            socket.on('appointment:assign', (data) => {
                try {
                    const { appointmentId, therapistId, therapistName } = data;
                    
                    console.log(`[Socket] Appointment ${appointmentId} assigned to therapist ${therapistName}`);
                    
                    // Notify relevant parties
                    io.to('therapists').emit('appointment:assigned', {
                        appointmentId,
                        therapistId,
                        therapistName,
                        timestamp: new Date().toISOString()
                    });
                    
                    io.to('secretaries').emit('appointment:assigned', {
                        appointmentId,
                        therapistId,
                        therapistName,
                        timestamp: new Date().toISOString()
                    });
                } catch (err) {
                    console.error(`[Socket] Error in appointment:assign:`, err.message);
                }
            });

            // Handle secretary-specific notifications
            socket.on('secretary:notification', (data) => {
                try {
                    const { message, type = 'info' } = data;
                    
                    // Broadcast to all secretaries
                    io.to('secretaries').emit('notify:message', {
                        message,
                        type,
                        from: socket.username,
                        timestamp: new Date().toISOString()
                    });
                } catch (err) {
                    console.error(`[Socket] Error in secretary:notification:`, err.message);
                }
            });

            // Handle connection errors
            socket.on('error', (error) => {
                console.error(`[Socket Error] ${socket.id}:`, error);
            });

            // Handle disconnection
            socket.on('disconnect', (reason) => {
                try {
                    console.log(`[Socket] User disconnected: ${socket.id} (${socket.username || 'unknown'}) - Reason: ${reason}`);

                    // Notify others if secretary disconnected
                    if (socket.userRole === 'secretary') {
                        io.to('secretaries').emit('user:status:offline', {
                            userId: socket.userId,
                            username: socket.username,
                            timestamp: new Date().toISOString()
                        });
                    }
                } catch (err) {
                    console.error(`[Socket] Error in disconnect handler:`, err.message);
                }
            });

        } catch (err) {
            console.error(`[Socket] Fatal error in connection handler:`, err.message);
            console.error(`[Socket] Stack:`, err.stack);
            socket.disconnect(true);
        }
    });

    // Handle any Socket.IO errors at the server level
    io.engine.on('connection_error', (err) => {
        console.error('[Socket.IO Engine] Connection error:', err.message);
    });

    // Log room info periodically
    setInterval(() => {
        try {
            const rooms = io.sockets.adapter.rooms;
            console.log(`[Socket] Active rooms: Secretaries=${rooms.get('secretaries')?.size || 0}, Therapists=${rooms.get('therapists')?.size || 0}, Admins=${rooms.get('admins')?.size || 0}, Doctors=${rooms.get('doctors')?.size || 0}`);
        } catch (err) {
            console.error(`[Socket] Error logging rooms:`, err.message);
        }
    }, 30000);
};
