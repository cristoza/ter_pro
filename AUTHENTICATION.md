# User Authentication

The application now has role-based authentication with four user types:

## User Roles

### 1. Admin
- **Access**: Full system access
- Can manage therapists, patients, appointments, and availability
- Can view all data and perform all operations

### 2. Doctor
- **Access**: Appointment creation only
- Can create appointments for patients
- Can view recent appointments
- Cannot manage therapists, patients, or availability

### 3. Secretary
- **Access**: View and edit all schedules
- Can view appointments for all therapists
- Can edit existing appointments (date, time, duration, patient info)
- Can filter by therapist, date, or week
- Can export schedules to CSV
- Cannot create or delete appointments

### 4. Therapist
- **Access**: View own schedule only
- Can view their assigned appointments
- Can filter appointments by date
- Cannot create or modify appointments

## Login Credentials

After running `node scripts/seed-users.js`, the following accounts are created:

```
Admin:
  Username: admin
  Password: admin123

Doctor:
  Username: doctor
  Password: doctor123

Secretary:
  Username: secretary
  Password: secretary123

Therapists (one account per therapist in database):
  Username: ana.morales
  Username: carlos.vega
  Username: maría.ruiz
  Password: therapist123 (for all therapists)
```

## Accessing the System

1. Navigate to `http://localhost:3000`
2. You will be redirected to the login page
3. Enter username and password
4. You will be redirected to the appropriate dashboard based on your role:
   - Admin → `/admin`
   - Doctor → `/doctor`
   - Secretary → `/secretary`
   - Therapist → `/therapist`

## Session Management

- Sessions last for 24 hours
- Click "Logout" button to end your session
- If you try to access a protected route without logging in, you'll be redirected to login
- If you try to access a route without proper permissions, you'll get a 403 error

## Security Notes

- Passwords are hashed using bcrypt
- Sessions are stored server-side
- Each role has specific route protections
- Change default passwords in production!
