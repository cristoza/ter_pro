require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { setRoutes } = require('./routes');
const { connectDB } = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const setupSocketHandlers = require('./services/socketHandler');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO using allowlist from environment
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    },
    allowEIO3: true,
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e6
});

console.log('[Socket.IO] Initialized. Allowed origins:', allowedOrigins);

// Setup Socket.IO event handlers
setupSocketHandlers(io);

const PORT = process.env.PORT || 3000;

// Make io accessible to our routers
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per IP per window
    message: 'Too many login attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
});

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        sameSite: 'lax'
    }
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Apply rate limiters
app.use('/login', loginLimiter);
app.use('/api', apiLimiter);

// Connect to the database
connectDB();

// Set up routes
setRoutes(app);

// Error handling middleware
app.use(errorHandler);

// Start the server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on:`);
    console.log(`  - Local:   http://localhost:${PORT}`);
    console.log(`  - Network: http://<your-ip>:${PORT}`);
    console.log(`\nTo find your IP address, run: ipconfig (Windows) or ifconfig (Linux/Mac)`);
});