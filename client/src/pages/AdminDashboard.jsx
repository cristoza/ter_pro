import { Link } from 'react-router-dom';

// Placeholder Dashboard Components
const AdminDashboard = () => (
<div className="admin-dashboard">
  <div style={{textAlign: 'center', marginBottom: '40px'}}>
    <h1>Bienvenido, Admin</h1>
    <p className="muted" style={{fontSize: '16px'}}>Gestiona las operaciones de tu hospital desde aquí</p>
  </div>

  <div className="dashboard-grid">
    <div className="stat">
      <div className="stat-value">4</div>
      <div className="stat-label">Módulos Totales</div>
    </div>
    <div className="stat">
      <div className="stat-value">OK</div>
      <div className="stat-label">Sistema Activo</div>
    </div>
    <div className="stat">
      <div className="stat-value">∞</div>
      <div className="stat-label">Acceso Completo</div>
    </div>
  </div>

  <div className="card" style={{maxWidth: '900px'}}>
    <div className="card-header" style={{textAlign: 'center'}}>
      <h2>Acciones Rápidas</h2>
    </div>
    <ul style={{listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', padding: '0'}}>
      <li>
        <Link to="/admin/therapists" className="action-card">
          <span className="action-icon"></span>
          <div className="action-content">
            <div className="action-title">Terapistas</div>
            <small className="muted">Gestionar perfiles de terapistas</small>
          </div>
        </Link>
      </li>
      <li>
        <Link to="/admin/patients" className="action-card">
          <span className="action-icon"></span>
          <div className="action-content">
            <div className="action-title">Pacientes</div>
            <small className="muted">Registros e historial de pacientes</small>
          </div>
        </Link>
      </li>
      <li>
        <Link to="/admin/appointments" className="action-card">
          <span className="action-icon"></span>
          <div className="action-content">
            <div className="action-title">Citas</div>
            <small className="muted">Ver y gestionar citas</small>
          </div>
        </Link>
      </li>
      <li>
        <Link to="/admin/machines" className="action-card">
          <span className="action-icon"></span>
          <div className="action-content">
            <div className="action-title">Equipos/Cubículos</div>
            <small className="muted">Gestionar Inventario y Estado</small>
          </div>
        </Link>
      </li>
      <li>
        <Link to="/admin/users" className="action-card">
          <span className="action-icon"></span>
          <div className="action-content">
            <div className="action-title">Usuarios</div>
            <small className="muted">Doctores, Secretarias y Admins</small>
          </div>
        </Link>
      </li>
    </ul>
  </div>
</div>
);

export default AdminDashboard;
