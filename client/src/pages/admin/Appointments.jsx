import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AdminAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [therapists, setTherapists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        patientId: '',
        date: '',
        time: '',
        type: 'Físico',
        durationMinutes: 30,
        status: 'scheduled'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [apptRes, patRes, therRes] = await Promise.all([
                api.get('/api/appointments'),
                api.get('/patients'),
                api.get('/therapists')
            ]);
            setAppointments(apptRes.data);
            setPatients(patRes.data);
            setTherapists(therRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching appointments data:', err);
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEdit = (appt) => {
        setEditingId(appt.id);
        const dateObj = new Date(appt.date);
        const dateStr = dateObj.toISOString().split('T')[0];
        setFormData({
            patientId: appt.patientId || '',
            date: dateStr,
            time: appt.time,
            type: appt.therapyType || 'Físico',
            durationMinutes: appt.durationMinutes || 30,
            status: appt.status || 'scheduled'
        });
        setShowModal(true);
    };

    const openNewModal = () => {
        setEditingId(null);
        setFormData({
            patientId: '',
            date: '',
            time: '',
            type: 'Físico',
            durationMinutes: 45,
            status: 'scheduled'
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Find selected patient for name fallback
            const selectedPatient = patients.find(p => p.id === parseInt(formData.patientId));
            
            const payload = {
                ...formData,
                patientName: selectedPatient ? selectedPatient.name : 'Unknown',
                therapyType: formData.type
            };

            if (editingId) {
                const response = await api.put(`/api/appointments/${editingId}`, payload);
                // Optimistic / update list
                setAppointments(prev => prev.map(a => a.id === editingId ? { ...a, ...response.data, patient: selectedPatient || a.patient } : a));
                toast.success('Cita actualizada exitosamente');
            } else {
                const response = await api.post('/api/appointments', payload);
                // Add patient info for immediate display
                const newAppt = {
                    ...response.data,
                    patient: selectedPatient
                };
                setAppointments(prev => [newAppt, ...prev]);
                toast.success('Cita creada exitosamente');
            }

            setShowModal(false);
            setEditingId(null);
        } catch (error) {
            console.error('Error saving appointment:', error);
            const msg = error.response?.data?.message || 'Error al guardar la cita';
            toast.error(msg);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Está seguro de eliminar esta cita?')) return;
        try {
            await api.delete(`/api/appointments/${id}`);
            setAppointments(prev => prev.filter(a => a.id !== id));
            toast.success('Cita eliminada exitosamente');
        } catch (error) {
            console.error('Error deleting appointment:', error);
            toast.error('Error al eliminar la cita');
        }
    };

    return (
        <div className="admin-view">
            <div className="page-header">
                <h1>Gestión de Citas</h1>
                <p>Programación y control de citas médicas</p>
                <button className="btn btn-primary" onClick={openNewModal}>
                    <span>+</span> Nueva Cita
                </button>
            </div>

            <div className="card">
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Hora</th>
                                <th>Paciente</th>
                                <th>Terapeuta</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center">Cargando...</td></tr>
                            ) : appointments.length === 0 ? (
                                <tr><td colSpan="6" className="text-center muted">No hay citas registradas.</td></tr>
                            ) : (
                                appointments.map(appt => (
                                    <tr key={appt.id}>
                                        <td>{new Date(appt.date).toLocaleDateString()}</td>
                                        <td>{appt.time}</td>
                                        <td>{appt.patient ? appt.patient.name : (appt.patientName || 'N/A')}</td>
                                        <td>{appt.therapist ? appt.therapist.name : 'Por asignar'}</td>
                                        <td>
                                            <span className={`status-badge status-${appt.status}`}>
                                                {appt.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button 
                                                    className="btn-link"
                                                    onClick={() => handleEdit(appt)}
                                                    style={{marginRight: '1rem'}}
                                                >
                                                    Editar
                                                </button>
                                                <button 
                                                    className="btn-link text-danger"
                                                    onClick={() => handleDelete(appt.id)}
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'white', padding: '24px', borderRadius: '8px', 
                        maxWidth: '500px', width: '100%'
                    }}>
                        <h3>{editingId ? 'Editar Cita' : 'Nueva Cita'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{marginBottom: '12px'}}>
                                <label style={{display:'block', marginBottom:'4px'}}>Paciente:</label>
                                <select 
                                    name="patientId" 
                                    value={formData.patientId} 
                                    onChange={handleInputChange} 
                                    required
                                    style={{width:'100%', padding:'8px'}}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} - {p.cedula}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div style={{display: 'flex', gap: '12px', marginBottom: '12px'}}>
                                <div style={{flex: 1}}>
                                    <label style={{display:'block', marginBottom:'4px'}}>Fecha:</label>
                                    <input 
                                        type="date" 
                                        name="date" 
                                        value={formData.date} 
                                        onChange={handleInputChange} 
                                        required 
                                        style={{width:'100%', padding:'8px'}}
                                    />
                                </div>
                                <div style={{flex: 1}}>
                                    <label style={{display:'block', marginBottom:'4px'}}>Hora:</label>
                                    <input 
                                        type="time" 
                                        name="time" 
                                        value={formData.time} 
                                        onChange={handleInputChange} 
                                        required 
                                        style={{width:'100%', padding:'8px'}}
                                    />
                                </div>
                            </div>

                            <div style={{marginBottom: '12px'}}>
                                <label style={{display:'block', marginBottom:'4px'}}>Tipo de Terapia:</label>
                                <select 
                                    name="type" 
                                    value={formData.type} 
                                    onChange={handleInputChange} 
                                    style={{width:'100%', padding:'8px'}}
                                >
                                    <option value="Físico">Física</option>
                                    <option value="Ocupacional">Ocupacional</option>
                                    <option value="Combinada">Combinada</option>
                                </select>
                            </div>

                            {editingId && (
                                <div style={{marginBottom: '12px'}}>
                                    <label style={{display:'block', marginBottom:'4px'}}>Estado:</label>
                                    <select 
                                        name="status" 
                                        value={formData.status} 
                                        onChange={handleInputChange} 
                                        style={{width:'100%', padding:'8px'}}
                                    >
                                        <option value="scheduled">Programada</option>
                                        <option value="attended">Asistió</option>
                                        <option value="cancelled">Cancelada</option>
                                        <option value="no_show">No Asistió</option>
                                    </select>
                                </div>
                            )}

                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px'}}>
                                <button type="button" onClick={() => setShowModal(false)} style={{padding: '8px 16px', cursor:'pointer'}}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" style={{padding: '8px 16px', cursor:'pointer'}}>
                                    {editingId ? 'Guardar Cambios' : 'Crear Cita'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAppointments;
