# Real-Time Notifications for Secretary Dashboard

This document describes the real-time notification system implemented for the physiotherapy clinic secretary dashboard.

## Overview

The notification system enables secretaries to receive real-time updates about:
- New appointments being created
- Appointment updates and reschedules
- Appointment cancellations
- Appointment series creation
- Patient check-ins
- System errors and alerts

## Architecture

### Backend Components

#### 1. **Notification Service** (`src/services/notificationService.js`)
- Centralized notification management
- Creates structured notification objects
- Maintains notification history (last 100)
- Emits notifications through Socket.IO

**Key Methods:**
- `createNotification()` - Generate notification object
- `notifyAppointmentCreated()` - New appointment alert
- `notifyAppointmentUpdated()` - Appointment changes
- `notifyAppointmentCancelled()` - Cancellation alert
- `notifySeriesCreated()` - Series notification
- `notifyPatientCheckIn()` - Patient arrival alert
- `notifyError()` - System error notification
- `getHistory()` - Retrieve notification history
- `getUnreadCount()` - Count unread notifications

#### 2. **Socket Handler** (`src/services/socketHandler.js`)
- Manages Socket.IO connections
- Groups secretaries in a "secretaries" room
- Handles connection/disconnection events
- Routes notifications to appropriate users

**Key Features:**
- User role-based room grouping
- User presence status (online/offline)
- Connection event logging
- Error handling

#### 3. **Appointment Controller** (`src/controllers/appointmentController.js`)
- Enhanced to use NotificationService
- Emits notifications on:
  - `createAppointment()` - New appointment
  - `updateAppointment()` - Updated appointment
  - `deleteAppointment()` - Cancelled appointment
  - `createSeries()` - Series creation

### Frontend Components

#### 1. **NotificationCenter Component** (`client/src/components/NotificationCenter.jsx`)
- Displays notification bell icon with badge
- Shows notification panel with history
- Filters notifications by type/status
- Real-time toast notifications

**Features:**
- Bell icon with unread count badge
- Filterable notification panel
- Mark as read functionality
- Clear notifications
- Toast alerts for critical events
- Responsive design

#### 2. **Socket Service** (`client/src/services/socket.js`)
- Manages Socket.IO connection
- Emits `user:join` on connect
- Provides event listeners
- Maintains singleton pattern

**New Methods:**
- `emitUserJoin()` - Register user with socket server
- `emit()` - Send events to server

#### 3. **Secretary Dashboard** (`client/src/pages/SecretaryDashboard.jsx`)
- Integrated NotificationCenter component
- Listens to notification events
- Updates appointment list in real-time
- Displays toast notifications

## Notification Events

### Backend Events (sent to clients)

| Event | Payload | Severity |
|-------|---------|----------|
| `notify:appointment:created` | {id, type, title, message, data, severity, timestamp} | success |
| `notify:appointment:updated` | {id, type, title, message, data, severity, timestamp} | info |
| `notify:appointment:cancelled` | {id, type, title, message, data, severity, timestamp} | warning |
| `notify:series:created` | {id, type, title, message, data, severity, timestamp} | success |
| `notify:patient:checkin` | {id, type, title, message, data, severity, timestamp} | success |
| `notify:error` | {id, type, title, message, data, severity, timestamp} | error |
| `user:status:online` | {userId, username, role, timestamp} | - |
| `user:status:offline` | {userId, username, timestamp} | - |

### Frontend Events (sent to server)

| Event | Payload |
|-------|---------|
| `user:join` | {userId, username, role} |
| `appointment:status:change` | {appointmentId, status, userId} |
| `appointment:assign` | {appointmentId, therapistId, therapistName} |
| `secretary:notification` | {message, type} |

## Usage

### For Secretaries

1. **View Notifications**
   - Click the bell icon (🔔) in the dashboard header
   - Notifications appear in real-time as they occur

2. **Filter Notifications**
   - Use filter buttons in the panel: All, Unread, Success, Warning, Error
   - Unread count shown on badge

3. **Manage Notifications**
   - Mark notifications as read by clicking the ✓ button
   - Delete individual notifications with the ✕ button
   - Clear all notifications with "Clear All" button

4. **Toast Alerts**
   - Important notifications show as toast at bottom-right
   - Auto-dismiss after 4-5 seconds

### For Developers

#### Adding New Notification Types

1. Create a new method in `notificationService.js`:
```javascript
notifyCustomEvent(data, io) {
    const notification = this.createNotification(
        'custom:event',
        'Title',
        'Message',
        data,
        'info'
    );
    io.to('secretaries').emit('notify:custom:event', notification);
}
```

2. Call in controller:
```javascript
notificationService.notifyCustomEvent(data, req.io);
```

3. Listen in frontend NotificationCenter:
```javascript
socket.on('notify:custom:event', handleNotification);
```

#### Accessing Notification History

On backend:
```javascript
const history = notificationService.getHistory(limit, type);
const unreadCount = notificationService.getUnreadCount();
```

## Styling

The NotificationCenter is styled with:
- Modern card design
- Smooth animations
- Color-coded severity (green/yellow/red/blue)
- Responsive layout (mobile-friendly)
- Scrollable notification list
- Accessibility features

## Performance Considerations

1. **Memory** - Only keeps last 100 notifications
2. **Network** - Uses Socket.IO for real-time updates
3. **Rendering** - Efficient React hooks and state management
4. **Scrolling** - Scrollable panel with optimized list

## Future Enhancements

- [ ] Persistent notification history (database)
- [ ] Notification preferences (mute/unmute types)
- [ ] Sound alerts for critical events
- [ ] Notification scheduling/quiet hours
- [ ] Push notifications to mobile
- [ ] Email digest of notifications
- [ ] Notification actions (quick approve/reject)
- [ ] Analytics dashboard for notifications

## Troubleshooting

### Notifications not appearing
1. Check Socket.IO connection in browser console
2. Verify `user:join` event is emitted
3. Check that user role is 'secretary'
4. Verify NotificationCenter component is imported

### Socket connection issues
1. Check CORS settings in `src/app.js`
2. Verify WS/WSS port is accessible
3. Check browser console for connection errors
4. Try refreshing page

### Missing notification events
1. Verify events are emitted in controllers
2. Check notification service is imported
3. Ensure `req.io` is passed to controllers
4. Verify event listener is registered in frontend

## Testing

To test the notification system:

1. Open Secretary Dashboard in browser
2. Open Network tab in DevTools
3. Create a new appointment
4. Verify:
   - Bell icon shows unread count badge
   - Toast notification appears
   - Notification panel updates
   - Appointment list refreshes

## Files Created/Modified

### New Files
- `src/services/notificationService.js` - Backend notification service
- `src/services/socketHandler.js` - Socket.IO event handlers
- `client/src/components/NotificationCenter.jsx` - Notification UI
- `client/src/components/NotificationCenter.css` - Notification styles

### Modified Files
- `src/app.js` - Added socket handler setup
- `src/controllers/appointmentController.js` - Enhanced with notifications
- `client/src/services/socket.js` - Added emit method and user:join
- `client/src/pages/SecretaryDashboard.jsx` - Integrated NotificationCenter

## Configuration

No configuration required - the system works out of the box. However, you can customize:

1. **Notification retention** - Change `100` in `notificationService.js`
2. **Toast duration** - Modify `toastConfig` in NotificationCenter.jsx
3. **Reconnection settings** - Update Socket.IO config in `socket.js`
4. **Notification styles** - Edit `NotificationCenter.css`

## Support

For issues or questions about the notification system, refer to:
- Console logs (browser DevTools)
- Socket.IO documentation
- React documentation
- Express Socket.IO examples
