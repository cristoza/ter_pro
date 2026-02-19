# Notification System Debug Guide

Follow these steps to test and debug the real-time notification system:

## Step 1: Restart the Backend Server

Kill any existing node processes and restart:
```bash
cd d:\fisitriabienporfa\physio-clinic-app
npm start
```

Wait for this output:
```
Server is running on:
  - Local:   http://localhost:3000
  - Network: http://<your-ip>:3000
[Socket] User connected: <socket-id>
```

## Step 2: Test in Secretary Dashboard

### In Browser Secretary Tab:
1. Open DevTools (F12)
2. Go to Console tab
3. You should see:
   ```
   Socket connected
   Socket: User secretary (secretary) joined
   [NotificationCenter] Listening for: notify:appointment:created
   [NotificationCenter] Listening for: notify:appointment:updated
   [NotificationCenter] Listening for: notify:appointment:cancelled
   [NotificationCenter] Listening for: notify:series:created
   [NotificationCenter] Listening for: notify:patient:checkin
   [NotificationCenter] Listening for: notify:error
   ```

### In Backend Server Terminal:
You should see:
```
[Socket] User connected: <socket-id>
[Socket] secretary (secretary) joined - <socket-id>
[Socket] Secretary secretary added to "secretaries" room
```

## Step 3: Create Appointment from Admin

### In Another Tab/Window (Admin Dashboard):
1. Create a new appointment
2. Watch the **backend console** for these messages:
   ```
   [APPOINTMENT] CREATE - Request received: { body: {...} }
   [APPOINTMENT] CREATE - Appointment created: { id: 123, date: "2024-02-18" }
   [APPOINTMENT] CREATE - Emitting notifications via Socket.IO
   [NOTIFICATION] Created notification: { type: 'appointment:created', title: '📅 Nueva Cita Registrada' }
   [NOTIFICATION] Emitting to secretaries room and all clients
   [NOTIFICATION] Emitted to secretaries room
   [NOTIFICATION] Emitted to all clients
   [APPOINTMENT] CREATE - Notification emitted successfully
   [APPOINTMENT] CREATE - Raw event emitted
   ```

### In Secretary Tab Console:
You should see:
```
[NotificationCenter] Received notification: { id: 1, type: "appointment:created", title: "📅 Nueva Cita Registrada", ... }
```

### In Secretary Dashboard UI:
1. Bell icon should show a red badge with "1"
2. Toast notification should appear at bottom-right: "📅 Nueva Cita Registrada: ..."
3. Click bell icon to open panel and see notification

## Step 4: Debugging Checklist

If notifications don't appear, check in order:

### Backend Not Emitting?
Look for these messages in backend console:
- ✅ `[APPOINTMENT] CREATE - Request received` → Appointment creation endpoint is being hit
- ✅ `[NOTIFICATION] Emitting to secretaries room` → Notifications are being sent
- ❌ `[APPOINTMENT] CREATE - WARNING: req.io is undefined!` → Socket.IO not attached to request

**Fix**: Make sure `src/app.js` has:
```javascript
app.use((req, res, next) => {
    req.io = io;
    next();
});
```

### Socket Not Connected?
Check secretary browser console for:
- ✅ `Socket connected` → WebSocket connection established
- ❌ `Socket connection error` → Connection failed
- ❌ No connection message → Socket service not initialized

**Fix**: Check browser Network tab → WS (WebSocket) to see if connection is active

### User Not Joining?
Check backend console for:
- ✅ `[Socket] secretary (secretary) joined` → User join event received
- ❌ `[Socket] User connected` but NO join message → emitUserJoin() not called
- ❌ User role not 'secretary' → Wrong role being sent

**Fix**: Check browser console for:
```javascript
localStorage.getItem('user')  // Should return secretary user object
```

### Notifications Not Received?
Check secretary browser console for:
- ✅ `[NotificationCenter] Received notification:` → Notification arrived
- ❌ `[NotificationCenter] Listening for: notify:appointment:created` → Listener registered
- ❌ No received message → Event not being emitted from backend

**Fix**: Check socket connection is active in Network tab → WS

## Step 5: Common Issues & Solutions

### Issue: "Socket connection error: 403 Forbidden"
**Cause**: User not authenticated
**Solution**: Clear browser cache, logout, login again

### Issue: Bell icon shows but no notifications
**Cause**: Socket connected but events not being emitted
**Solution**: Check Step 4 checklist above

### Issue: Notifications appear then disappear
**Cause**: Toast is auto-dismissing but notification not in panel
**Solution**: Check NotificationCenter component code, shouldn't auto-dismiss notification panel

### Issue: Nginx proxy not passing WebSocket
**Cause**: Nginx not configured for WebSocket upgrade
**Solution**: Check nginx.conf has `/socket.io/` location block with:
```
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

## Test Log Template

Copy this and fill in as you test:

```
Date: ___________
Secretary Browser Console Output:
________________
________________
________________

Backend Console Output:
________________
________________
________________

Bell Icon Shows: YES / NO
Toast Notification Shows: YES / NO
Notification Appears in Panel: YES / NO

Errors in Console: 
________________

Network WS Connection Active: YES / NO
```

## Next Steps if Still Not Working

1. **Check browser console for errors** - fix any error messages
2. **Check backend server logs** - verify appointment creation is happening
3. **Check Network tab WebSocket** - verify connection is active
4. **Verify user role** - localStorage.getItem('user') should have role: 'secretary'
5. **Check Nginx logs** - verify requests are being proxied

Use this information when asking for help!
