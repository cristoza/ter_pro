# 🏥 Physio Clinic Management System# Physiotherapy Clinic Appointment Management System



A comprehensive web application for managing a physical therapy clinic, built with Node.js, Express, PostgreSQL, and EJS templates.This project is a web application for managing appointments in a physiotherapy clinic. It is built using Node.js and follows the Model-View-Controller (MVC) architecture.



## ✨ Features## Features



### 👥 Role-Based Access Control- Create and list appointments

- **Admin**: Full system access - manage therapists, patients, appointments, and availability- User-friendly interface for managing appointments

- **Doctor**: Create appointments and view recent appointments- Error handling middleware

- **Secretary**: View and edit all schedules, export to CSV- Input validation for appointment data

- **Therapist**: View personal schedule with responsive mobile interface

## Project Structure

### 📅 Smart Appointment Management

- **Automatic Scheduling**: Intelligent slot finding based on therapist availability```

- **Series Creation**: Book 5 or 10 consecutive sessions automaticallyphysio-clinic-app

- **Patient Management**: Cedula-based patient lookup and verification├── src

- **Real-time Highlighting**: Newly created appointments highlight with animation│   ├── app.js                  # Entry point of the application

- **Availability Management**: Configure therapist schedules by day and time│   ├── controllers             # Contains controllers for handling requests

│   ├── models                  # Contains data models

### 🎨 Modern UI/UX│   ├── routes                  # Defines application routes

- Clean, centered card-based design│   ├── services                # Contains business logic

- Sky blue color scheme (#0ea5e9)│   ├── middlewares             # Middleware functions

- Responsive design for mobile, tablet, and desktop│   ├── config                  # Configuration files

- Smooth animations and transitions│   ├── views                   # EJS templates for rendering views

- Spanish language interface│   ├── public                  # Static files (CSS, JS)

│   └── utils                   # Utility functions

### 🔒 Security Features├── tests                       # Unit tests for the application

- Bcrypt password hashing├── .env.example                # Example environment variables

- Server-side session management (24-hour duration)├── .gitignore                  # Files to ignore in Git

- Rate limiting on login (5 attempts per 15 minutes)├── package.json                # Project metadata and dependencies

- Role-based route protection└── README.md                   # Project documentation

```

## 🚀 Getting Started

## Installation

### Prerequisites

- Node.js (v14 or higher)1. Clone the repository:

- PostgreSQL (v12 or higher)   ```

- npm or yarn   git clone <repository-url>

   cd physio-clinic-app

### Installation   ```



1. **Clone the repository**2. Install dependencies:

```bash   ```

git clone https://github.com/yourusername/physio-clinic-app.git   npm install

cd physio-clinic-app   ```

```

3. Set up environment variables by copying `.env.example` to `.env` and updating the values as needed.

2. **Install dependencies**

```bash## Usage

npm install

```To start the application, run:

```

3. **Set up environment variables**npm start

```

Create a `.env` file in the root directory:

```envVisit `http://localhost:3000` in your browser to access the application.

# Database Configuration

DB_NAME=physio_clinic## Testing

DB_USER=postgres

DB_PASSWORD=your_passwordTo run the tests, use:

DB_HOST=localhost```

DB_PORT=5432npm test

```

# Server Configuration

PORT=3000## Contributing

NODE_ENV=development

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

# Session Secret (change in production!)

SESSION_SECRET=your-secret-key-change-in-production## License

```

This project is licensed under the MIT License.
4. **Set up the database**
```bash
# Create database
psql -U postgres -c "CREATE DATABASE physio_clinic;"

# Run setup scripts
node scripts/create-db.js
node scripts/seed-db.js
node scripts/seed-users.js
```

5. **Start the application**
```bash
npm start
```

Application available at `http://localhost:3000`

## 👤 Default User Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Doctor | doctor | doctor123 |
| Secretary | secretary | secretary123 |
| Therapist | ana.morales | therapist123 |

⚠️ **Change passwords in production!**

## 📁 Project Structure

```
physio-clinic-app/
├── src/
│   ├── app.js                 # Main application
│   ├── config/db.js          # Database config
│   ├── controllers/          # Request handlers
│   ├── middlewares/          # Auth, validation, rate limiting
│   ├── models/              # Sequelize models
│   ├── routes/              # Express routes
│   ├── services/            # Business logic
│   ├── views/               # EJS templates
│   └── public/              # Static files
├── scripts/                 # DB setup scripts
└── tests/                   # Tests
```

## 🛠️ Technologies

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Templates**: EJS
- **Auth**: bcrypt, express-session
- **Security**: Helmet.js, express-rate-limit
- **Styling**: Custom CSS

## 📱 Responsive Design

- **Desktop** (>1024px): Full features
- **Tablet** (768px-1024px): Touch-optimized
- **Mobile** (<768px): Card-based layout

## 🔧 API Endpoints

### Authentication
- `POST /login` - Login
- `POST /logout` - Logout

### Appointments
- `GET /api/appointments` - List
- `POST /api/appointments` - Create single
- `POST /api/appointments/series` - Create series (5/10 sessions)
- `PUT /api/appointments/:id` - Update
- `DELETE /api/appointments/:id` - Delete

### Patients
- `GET /patients` - List
- `GET /patients/cedula/:cedula` - Find by cedula
- `POST /patients` - Create
- `PUT /patients/:id` - Update
- `DELETE /patients/:id` - Delete

### Therapists
- `GET /therapists` - List
- `POST /therapists` - Create
- `PUT /therapists/:id` - Update
- `DELETE /therapists/:id` - Delete

### Availability
- `GET /availability` - List slots
- `POST /availability` - Create slot
- `DELETE /availability/:id` - Delete slot

## 🎯 Key Features

### Smart Scheduling
Automatically finds available time slots based on:
- Therapist availability schedules
- Existing appointment conflicts
- Business day constraints (Mon-Fri)
- Time windows (8:00 AM - 6:00 PM)

### Series Appointments
- Schedules consecutive business days
- Finds therapist available for all dates
- All-or-nothing transactions

### Recent Appointments
- Shows 10 most recent (doctor view)
- Sorted by creation order
- 3-second highlight animation for new appointments

## 🔐 Security for Production

1. Change `SESSION_SECRET` to strong random value
2. Enable HTTPS (`cookie.secure: true`)
3. Update default passwords
4. Configure CORS properly
5. Set up database backups
6. Enable logging/monitoring

## 📝 Scripts

```bash
npm start              # Start server
npm test               # Run tests
node scripts/create-db.js    # Init database
node scripts/seed-db.js      # Seed sample data
node scripts/seed-users.js   # Create users
```

## 📄 License

MIT License

## 📧 Support

Open an issue on GitHub for support.

---

**Note**: Designed for internal clinic use. Ensure proper security measures before production deployment.
