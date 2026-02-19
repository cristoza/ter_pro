# Real-Time Notifications - Quick Start Guide

## What Was Built

A complete real-time notification system for the secretary dashboard with:

✅ Real-time appointment notifications
✅ Notification center with bell icon
✅ Toast alerts for critical events
✅ Notification history & filtering
✅ Socket.IO integration
✅ User presence status tracking
✅ Severity-based color coding

## Files Added/Modified

### Backend
```
NEW:  src/services/notificationService.js
NEW:  src/services/socketHandler.js
MODIFIED: src/app.js
MODIFIED: src/controllers/appointmentController.js
```

### Frontend
```
NEW:  client/src/components/NotificationCenter.jsx
NEW:  client/src/components/NotificationCenter.css
MODIFIED: client/src/services/socket.js
MODIFIED: client/src/pages/SecretaryDashboard.jsx
```

## How to Test

### Step 1: Start the Application
```bash
# Terminal 1: Start backend
npm start

# Terminal 2: Start frontend
cd client && npm run dev
```

### Step 2: Login as Secretary
1. Go to http://localhost:5173 (or your frontend URL)
2. Login with: `secretary / secretary123`
3. You should see the Secretary Dashboard

### Step 3: Test Notifications

#### Test 1: Create a New Appointment
1. Go to another browser/tab and login as admin
2. Create a new appointment
3. Back in the secretary dashboard, you should see:
   - 🔔 Bell icon with red badge showing "1"
   - Toast notification at bottom-right
   - New notification in the notification panel

#### Test 2: Update an Appointment
1. Edit an existing appointment
2. Secretary should receive:
   - Toast: "🔄 Cita Actualizada"
   - Notification in panel with update details

#### Test 3: Create Multiple Appointments
1. Create an appointment series (5 appointments)
2. You should see:
   - Toast: "📊 5 citas registradas para [Patient Name]"
   - Notification in panel: "Series de Citas Creada"

#### Test 4: Cancel Appointment
1. Delete an appointment
2. You should see:
   - Toast: "⚠️ [Patient Name]"
   - Notification: "🗑️ Cita Cancelada"

### Step 4: Test Notification Features

#### Filter Notifications
- Click different filter buttons: All, Unread, Success, Warning, Error
- Only matching notifications will show

#### Mark as Read
- Click ✓ button on unread notification
- Badge count decreases
- Notification loses "unread" highlight

#### Delete Notification
- Click ✕ button to delete individual notification
- Click "Limpiar Todo" to clear all

## Real-Time Features

### Automatic Updates
- Appointment list updates automatically
- No page refresh needed
- Multiple secretaries see updates instantly

### Socket Connection
- User automatically joins "secretaries" room
- Notifications broadcast to all secretaries
- User status tracked (online/offline)

### Toast Alerts
- Success events (green): New appointments, series creation
- Warning events (yellow): Cancellations
- Error events (red): System errors
- Info events (blue): Updates

## Troubleshooting

### Notifications Not Showing?
```bash
# Check browser console (F12)
# Look for: "Socket connected"
# If missing: Check if Socket.IO is running on backend
```

### Bell Icon Not Visible?
1. Make sure NotificationCenter is imported in SecretaryDashboard
2. Check: `client/src/pages/SecretaryDashboard.jsx` line 1-5
3. Verify import: `import NotificationCenter from '../components/NotificationCenter';`

### Cannot See Appointment Changes?
1. Verify both windows have the same user logged in
2. Check browser console for Socket.IO errors
3. Try refreshing the page
4. Check your internet connection (WebSocket needed)

### Toast Notifications Not Appearing?
1. Make sure `react-hot-toast` is installed
2. Check that No CSS is blocking the toast
3. Look for errors in browser console

## Monitoring

### Check Socket Connection
Open browser console (F12):
```javascript
// Should see:
"Socket connected"
"Socket: User secretary (secretary) joined"
"[Socket] Active rooms: Secretaries=1, Therapists=0"
```

### View Active Connections
Backend logs will show:
```
[Socket] User connected: [socket-id]
[Socket] secretary joined - [socket-id]
[Socket] Secretary secretary added to "secretaries" room
[Socket] Active rooms: Secretaries=1, Therapists=0
```

## Features Explained

### 🔔 Bell Icon
- Shows unread notification count
- Click to open/close notification panel
- Badge updates automatically

### 📱 Notification Panel
- Shows all notifications in reverse chronological order
- Filters by type: All, Unread, Success, Warning, Error
- Color-coded left border by severity
- Timestamp for each notification

### 🎵 Toast Notifications
- Brief alerts at bottom-right of screen
- Auto-dismiss after 4-5 seconds
- Icons show notification type
- Click to dismiss manually

### 📊 Notification Details
Each notification shows:
- **Title**: Main message (e.g., "📅 Nueva Cita Registrada")
- **Message**: Details (e.g., "Juan with Dr. Smith on 2024-02-18")
- **Time**: When notification was received
- **Severity**: Color coding (success/warning/error/info)
- **Actions**: Mark as read, Delete

## Advanced Configuration

### Change Toast Position
In `NotificationCenter.jsx`, line ~120:
```javascript
position: 'bottom-right' // Change to: top-right, bottom-left, etc.
```

### Change Notification History Limit
In `notificationService.js`, line ~33:
```javascript
if (this.notifications.length > 100) { // Change 100 to desired limit
```

### Disable Auto-dismiss for Errors
In `notificationCenter.jsx`, line ~70:
```javascript
// Remove or modify this block to keep error notifications visible
if (notification.severity === 'error' || notification.severity === 'success') {
    setTimeout(() => setShowPanel(false), 5000);
}
```

## Next Steps

1. **Customize Notifications**
   - Add more notification types
   - Change icons and colors
   - Add sound alerts

2. **Enhance Features**
   - Add notification preferences
   - Implement persistent history
   - Add notification scheduling

3. **Production Deployment**
   - Test with multiple concurrent secretaries
   - Monitor Socket.IO performance
   - Implement error tracking

## Support & Documentation

- Full documentation: See `NOTIFICATIONS.md`
- Socket.IO docs: https://socket.io/docs/
- React docs: https://react.dev/
- Socket.IO Client: https://socket.io/docs/client-api/

---

**🎉 Your real-time notification system is ready to use!**

Enjoy your new secretary dashboard notifications!
