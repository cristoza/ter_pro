import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [therapists, setTherapists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'doctor',
        therapistId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, therapistsRes] = await Promise.all([
                api.get('/api/users'),
                api.get('/therapists') // Assuming we have an endpoint to list therapists
            ]);
            // Ensure data is array before setting
            setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
            setTherapists(Array.isArray(therapistsRes.data) ? therapistsRes.data : []);
        } catch (error) {
            console.error('Error fetching data:', error);
            // If 401/403, standard axios interceptor might handle it, or we show a message
            if (error.response && error.response.status === 401) {
                // Redirect handled by App or show login prompt
                window.location.href = '/login'; 
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                // For update, exclude password if empty
                const payload = { ...formData };
                if (!payload.password) delete payload.password;
                
                // Optimistic update
                setUsers(prev => prev.map(u => 
                   u.id === editingId ? { 
                       ...u, 
                       ...payload, 
                       // Ensure valid role display
                       role: payload.role || u.role,
                       // Attach therapist object for display
                       therapist: therapists.find(t => t.id == payload.therapistId) || (payload.role !== 'therapist' ? null : u.therapist)
                   } : u
                ));

                await api.put(`/api/users/${editingId}`, payload);
            } else {
                const res = await api.post('/api/users', formData);
                const newUser = res.data;
                
                // Attach therapist object for display if it exists
                if (newUser.therapistId) {
                    newUser.therapist = therapists.find(t => t.id == newUser.therapistId);
                }
                
                setUsers(prev => [...prev, newUser]);
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({ username: '', password: '', role: 'doctor', therapistId: '' });
            
            // No fetch data needed - state is updated
        } catch (error) {
            console.error('Error saving user:', error);
            toast.error(error.response?.data?.message || 'Error al guardar usuario');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este usuario?')) return;
        try {
            await api.delete(`/api/users/${id}`);
            fetchData();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const handleEdit = (user) => {
        setEditingId(user.id);
        setFormData({
            username: user.username,
            password: '', // Leave empty to keep unchanged
            role: user.role,
            therapistId: user.therapistId || ''
        });
        setShowModal(true);
    };

    const openNewModal = () => {
        setEditingId(null);
        setFormData({ username: '', password: '', role: 'doctor', therapistId: '' });
        setShowModal(true);
    };

    return (
        <div className="admin-view">
            <div className="page-header">
                <h1>Gestión de Usuarios</h1>
                <p>Administra los usuarios del sistema y sus roles</p>
                <div style={{ marginTop: '16px' }}>
                    <button className="btn btn-primary" onClick={openNewModal} style={{ marginRight: '8px' }}>
                        <span>+</span> Nuevo Usuario
                    </button>
                </div>
            </div>
            
            <div className="card">
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Rol</th>
                                <th>Vinculado a</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5">Cargando...</td></tr>
                            ) : users.length > 0 ? (
                                users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.username}</td>
                                        <td><span className={`badge badge-${user.role === 'admin' ? 'danger' : 'info'}`}>{user.role}</span></td>
                                        <td>{user.therapist ? user.therapist.name : '-'}</td>
                                        <td><span className="badge badge-success">Activo</span></td>
                                        <td>
                                            <button 
                                                className="btn btn-sm btn-secondary" 
                                                onClick={() => handleEdit(user)}
                                                style={{marginRight: '8px'}}
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-danger" 
                                                style={{backgroundColor: '#ff4444', color: 'white'}}
                                                onClick={() => handleDelete(user.id)}
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center muted">
                                        No hay usuarios cargados (o error de conexión)
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{backgroundColor: 'white', padding: '24px', borderRadius: '8px', minWidth: '400px'}}>
                        <h3>{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{marginBottom: '12px'}}>
                                <label style={{display: 'block'}}>Nombre de Usuario</label>
                                <input 
                                    type="text" 
                                    name="username" 
                                    value={formData.username} 
                                    onChange={handleInputChange}
                                    style={{width: '100%', padding: '8px'}}
                                    required 
                                />
                            </div>
                            <div style={{marginBottom: '12px'}}>
                                <label style={{display: 'block'}}>Contraseña {editingId && <small>(Dejar vacía para no cambiar)</small>}</label>
                                <input 
                                    type="password" 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleInputChange}
                                    style={{width: '100%', padding: '8px'}}
                                    required={!editingId}
                                />
                            </div>
                            <div style={{marginBottom: '12px'}}>
                                <label style={{display: 'block'}}>Rol</label>
                                <select 
                                    name="role" 
                                    value={formData.role} 
                                    onChange={handleInputChange}
                                    style={{width: '100%', padding: '8px'}}
                                >
                                    <option value="doctor">Doctor</option>
                                    <option value="therapist">Terapeuta</option>
                                    <option value="secretary">Secretaria</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            
                            {formData.role === 'therapist' && (
                                <div style={{marginBottom: '12px'}}>
                                    <label style={{display: 'block'}}>Vincular a Terapeuta</label>
                                    <select 
                                        name="therapistId" 
                                        value={formData.therapistId} 
                                        onChange={handleInputChange}
                                        style={{width: '100%', padding: '8px'}}
                                        required
                                    >
                                        <option value="">Seleccione un terapeuta...</option>
                                        {therapists.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <small className="muted">Se requiere un perfil de terapeuta existente.</small>
                                </div>
                            )}

                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px'}}>
                                <button type="button" onClick={() => setShowModal(false)} style={{padding: '8px 16px', background: '#ccc', border: 'none'}}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" style={{padding: '8px 16px'}}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
