import { io } from 'socket.io-client';

// Use the current origin (e.g. localhost:80 from Nginx) instead of hardcoded 3000
// This ensures requests go through Nginx proxy
const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect() {
        if (!this.socket) {
            console.log('[Socket] Initializing Socket.IO connection');
            console.log('[Socket] SOCKET_URL:', SOCKET_URL);
            
            this.socket = io(SOCKET_URL, {
                path: '/socket.io/',
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                transports: ['polling', 'websocket'],
                upgrade: true,
                rememberUpgrade: true,
                secure: false,
                rejectUnauthorized: false,
                withCredentials: false  // Disable credentials for localhost
            });

            this.socket.on('connect', () => {
                console.log('[Socket] Connected successfully with ID:', this.socket.id);
                console.log('[Socket] Current transport:', this.socket.io.engine.transport.name);
                // Emit user join event with current user info
                this.emitUserJoin();
            });

            this.socket.on('disconnect', (reason) => {
                console.log('[Socket] Disconnected from server - Reason:', reason);
            });
            
            this.socket.on('connect_error', (err) => {
                console.error('[Socket] Connection error:', err.message || err);
                console.error('[Socket] Error type:', err.type);
                console.error('[Socket] Error code:', err.code);
                console.error('[Socket] Full error:', err);
            });
            
            this.socket.on('error', (err) => {
                console.error('[Socket] Socket error event:', err);
            });
            
            this.socket.on('transport error', (err) => {
                console.error('[Socket] Transport error:', err);
            });

            // Log when transport changes
            this.socket.io.on('packet', ({ type, data }) => {
                if (type === 0) { // CONNECT packet
                    console.log('[Socket] Received CONNECT packet');
                }
            });
        }
        return this.socket;
    }

    /**
     * Emit user join event to register with the socket server
     */
    emitUserJoin() {
        try {
            console.log('[Socket] Attempting to emit user:join event');
            const userStr = localStorage.getItem('user');
            console.log('[Socket] User from localStorage:', userStr);
            
            if (userStr) {
                const user = JSON.parse(userStr);
                console.log('[Socket] Parsed user:', user);
                
                if (!user.id || !user.role) {
                    console.warn('[Socket] User object missing required fields:', { id: user.id, role: user.role });
                    return;
                }
                
                this.socket?.emit('user:join', {
                    userId: user.id,
                    username: user.username || user.name,
                    role: user.role
                });
                console.log(`[Socket] Emitted user:join - User ${user.username || user.name} (${user.role})`);
            } else {
                console.warn('[Socket] No user found in localStorage. Cannot emit user:join');
            }
        } catch (err) {
            console.error('[Socket] Error emitting user join:', err);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event, callback) {
        if (!this.socket) return;
        this.socket.on(event, callback);
    }

    off(event, callback) {
        if (!this.socket) return;
        this.socket.off(event, callback);
    }

    emit(event, data) {
        if (!this.socket) return;
        this.socket.emit(event, data);
    }
}

export const socketService = new SocketService();
export default socketService;

