import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminTherapists from './pages/admin/Therapists';
import AdminPatients from './pages/admin/Patients';
import AdminAppointments from './pages/admin/Appointments';
import AdminUsers from './pages/admin/Users';
import AdminMachines from './pages/admin/Machines';
import AdminAnalytics from './pages/admin/Analytics';
import DoctorDashboard from './pages/DoctorDashboard';
import TherapistDashboard from './pages/TherapistDashboard';
import SecretaryDashboard from './pages/SecretaryDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import './App.css';

// Layout wrapper for role-based sections
const RoleLayout = ({ role }) => {
     return (
        <Layout role={role}>
            <Outlet />
        </Layout>
     );
};

// Simple redirects based on role to their main dashboard
const DashboardRedirect = () => {
    const userStr = localStorage.getItem('user');
    let user = null;
    try {
        user = JSON.parse(userStr);
    } catch (e) {
        user = null;
    }

    if (!user) return <Navigate to="/login" />;

    switch(user.role) {
        case 'admin': return <Navigate to="/admin" />;
        case 'doctor': return <Navigate to="/doctor" />;
        case 'therapist': return <Navigate to="/therapist" />;
        case 'secretary': return <Navigate to="/secretary" />;
        default: return <Navigate to="/login" />;
    }
};

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
             <Route path="/dashboard" element={<DashboardRedirect />} />
             
             {/* Admin Routes */}
             <Route path="/admin" element={<RoleLayout role="admin" />}>
                <Route index element={<AdminDashboard />} />
                <Route path="therapists" element={<AdminTherapists />} />
                <Route path="patients" element={<AdminPatients />} />
                <Route path="appointments" element={<AdminAppointments />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="machines" element={<AdminMachines />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                {/* Add other admin routes */}
             </Route>

             {/* Doctor Routes */}
             <Route path="/doctor" element={<RoleLayout role="doctor" />}>
                <Route index element={<DoctorDashboard />} />
             </Route>

             {/* Therapist Routes */}
             <Route path="/therapist" element={<RoleLayout role="therapist" />}>
                <Route index element={<TherapistDashboard />} />
             </Route>

             {/* Secretary Routes */}
             <Route path="/secretary" element={<RoleLayout role="secretary" />}>
                <Route index element={<SecretaryDashboard />} />
             </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
