import { useNavigate, Link } from 'react-router-dom';
import axios from '../services/api';

const Layout = ({ role, children }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('/logout');
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const getNavLinks = () => {
    if (role === 'admin') {
      return (
        <nav className="main-nav">
            <ul>
                <li><Link to="/admin">Panel</Link></li>
                <li><Link to="/admin/therapists">Terapistas</Link></li>
                <li><Link to="/admin/patients">Pacientes</Link></li>
                <li><Link to="/admin/appointments">Citas</Link></li>
                <li><Link to="/admin/machines">Equipos</Link></li>
                <li><Link to="/admin/analytics">Analíticas</Link></li>
                <li><Link to="/admin/users">Usuarios</Link></li>
            </ul>
        </nav>
      );
    }
    return null;
  };

  const getRoleLabel = () => {
      switch(role) {
          case 'admin': return 'Portal Administrativo';
          case 'doctor': return 'Portal Médico';
          case 'therapist': return 'Portal de Terapistas';
          case 'secretary': return 'Portal de Secretaría';
          default: return 'Portal de Salud';
      }
  };

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
            <div className="brand">
                <Link to={`/${role}`} className="logo" style={role !== 'admin' ? {cursor: 'default'} : {}}>Hospital del Adulto Mayor</Link>
                <span className="tag">{getRoleLabel()}</span>
            </div>
            <div className="header-right">
                {getNavLinks()}
                <div className="header-actions">
                    <button onClick={handleLogout} className="btn btn-danger btn-sm">Cerrar Sesión</button>
                </div>
            </div>
        </div>
      </header>
      <main className="container main-content" role="main">
        {children}
      </main>
      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Hospital del Adulto Mayor — Sistema de gestión de citas</p>
      </footer>
    </>
  );
};

export default Layout;
