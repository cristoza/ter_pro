import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AdminAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [therapists, setTherapists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
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

    // Filter Logic
    const filteredAppointments = appointments.filter(appt => {
        const patientName = appt.patient ? appt.patient.name : (appt.patientName || '');
        const therapistName = appt.therapist ? appt.therapist.name : '';
        const searchLower = searchTerm.toLowerCase();
        
        return patientName.toLowerCase().includes(searchLower) || 
               therapistName.toLowerCase().includes(searchLower) ||
               appt.status.toLowerCase().includes(searchLower);
    });

    return (
        <div style={{maxWidth: '1200px', margin: '0 auto', color: '#333'}}>
            
            {/* Header Section */}
            <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '24px'}}>
                <div style={{
                    width: '48px', height: '48px', backgroundColor: '#e65100', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                </div>
                <div>
                    <h1 style={{margin: 0, fontSize: '24px', fontWeight: 'bold'}}>Panel de Administración</h1>
                    <p style={{margin: 0, color: '#666', fontSize: '14px'}}>Gestiona citas, pacientes y terapeutas</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px'}}>
                {[
                    { label: 'Citas Totales', value: appointments.length, icon: '📅' },
                    { label: 'Para Hoy', value: appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length, icon: '📍' },
                    { label: 'Confirmadas', value: appointments.filter(a => a.status === 'scheduled').length, icon: '✅' },
                    { label: 'Completadas', value: appointments.filter(a => a.status === 'attended').length, icon: '🏁' }
                ].map((stat, idx) => (
                    <div key={idx} style={{
                        backgroundColor: 'white', padding: '20px', borderRadius: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #eee'
                    }}>
                         <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#666', marginBottom: '8px', fontSize: '0.9em'}}>
                            <span>{stat.icon}</span> {stat.label}
                        </div>
                        <div style={{fontSize: '28px', fontWeight: 'bold', color: '#111'}}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{display: 'flex', gap: '8px', marginBottom: '24px'}}>
                {[
                    { label: 'Citas', to: '/admin/appointments', active: true, icon: '📅' },
                    { label: 'Pacientes', to: '/admin/patients', active: false },
                    { label: 'Terapeutas', to: '/admin/therapists', active: false }
                ].map((tab, idx) => (
                    <Link 
                        key={idx} 
                        to={tab.to}
                        style={{
                            padding: '10px 24px', 
                            borderRadius: '30px', 
                            backgroundColor: tab.active ? '#111' : 'transparent',
                            color: tab.active ? 'white' : '#666',
                            textDecoration: 'none',
                            fontWeight: tab.active ? '500' : 'normal',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            fontSize: '14px'
                        }}
                    >
                        {tab.icon && <span>{tab.icon}</span>}
                        {tab.label}
                    </Link>
                ))}
            </div>

            {/* Main Content Card */}
             <div style={{
                backgroundColor: 'white', borderRadius: '16px', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
                padding: '24px', marginBottom: '40px'
            }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                     <div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <div style={{
                                width: '40px', height: '40px', backgroundColor: '#e8eaf6', 
                                borderRadius: '8px', color: '#3f51b5', display: 'flex', 
                                alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                            }}>📅</div>
                            <div>
                                <h2 style={{margin: 0, fontSize: '20px', fontWeight: 'bold'}}>Gestión de Citas</h2>
                                <p style={{margin: 0, color: '#666', fontSize: '13px'}}>{appointments.length} citas registradas</p>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={openNewModal}
                        style={{
                            backgroundColor: '#111', color: 'white', border: 'none',
                            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                            fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <span>+</span> Nueva Cita
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{marginBottom: '24px', position: 'relative'}}>
                    <input 
                        type="text" 
                        placeholder="Buscar por paciente, terapeuta o estado..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '95%', padding: '12px 12px 12px 40px', borderRadius: '8px',
                            border: '1px solid #eee', backgroundColor: '#f8f9fa', fontSize: '14px'
                        }}
                    />
                    <span style={{position: 'absolute', left: '12px', top: '12px', color: '#999'}}>🔍</span>
                </div>

                <div className="table-responsive">
                    <table style={{width: '100%', borderCollapse: 'separate', borderSpacing: '0'}}>
                        <thead>
                            <tr style={{textAlign: 'left', color: '#666', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                                <th style={{padding: '16px 12px', fontWeight: '600', borderBottom: '1px solid #eee'}}>Fecha</th>
                                <th style={{padding: '16px 12px', fontWeight: '600', borderBottom: '1px solid #eee'}}>Hora</th>
                                <th style={{padding: '16px 12px', fontWeight: '600', borderBottom: '1px solid #eee'}}>Paciente</th>
                                <th style={{padding: '16px 12px', fontWeight: '600', borderBottom: '1px solid #eee'}}>Terapeuta</th>
                                <th style={{padding: '16px 12px', fontWeight: '600', borderBottom: '1px solid #eee'}}>Estado</th>
                                <th style={{padding: '16px 12px', fontWeight: '600', borderBottom: '1px solid #eee'}}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{padding: '30px', textAlign: 'center'}}>Cargando...</td></tr>
                            ) : filteredAppointments.length === 0 ? (
                                <tr><td colSpan="6" style={{padding: '30px', textAlign: 'center', color: '#888'}}>No se encontraron citas.</td></tr>
                            ) : (
                                filteredAppointments.map(appt => (
                                    <tr key={appt.id} style={{fontSize: '14px', transition: 'background-color 0.2s'}}>
                                        <td style={{padding: '16px 12px', borderBottom: '1px solid #f5f5f5', fontWeight: '500'}}>
                                            {new Date(appt.date).toLocaleDateString()}
                                        </td>
                                        <td style={{padding: '16px 12px', borderBottom: '1px solid #f5f5f5'}}>{appt.time}</td>
                                        <td style={{padding: '16px 12px', borderBottom: '1px solid #f5f5f5'}}>
                                            {appt.patient ? appt.patient.name : (appt.patientName || 'N/A')}
                                        </td>
                                        <td style={{padding: '16px 12px', borderBottom: '1px solid #f5f5f5'}}>
                                            {appt.therapist ? appt.therapist.name : <span style={{color: '#999'}}>Por asignar</span>}
                                        </td>
                                        <td style={{padding: '16px 12px', borderBottom: '1px solid #f5f5f5'}}>
                                            <span style={{
                                                backgroundColor: appt.status === 'scheduled' ? '#e3f2fd' : 
                                                                appt.status === 'attended' || appt.status === 'completed' ? '#dcfce7' : 
                                                                appt.status === 'cancelled' || appt.status === 'no_show' ? '#fee2e2' : '#f5f5f5',
                                                color: appt.status === 'scheduled' ? '#1565c0' : 
                                                       appt.status === 'attended' || appt.status === 'completed' ? '#166534' : 
                                                       appt.status === 'cancelled' || appt.status === 'no_show' ? '#b91c1c' : '#666',
                                                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                                            }}>
                                                {appt.status}
                                            </span>
                                        </td>
                                        <td style={{padding: '16px 12px', borderBottom: '1px solid #f5f5f5'}}>
                                            <div style={{display: 'flex', gap: '8px'}}>
                                                <button 
                                                    onClick={() => handleEdit(appt)}
                                                    style={{border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px'}}
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(appt.id)}
                                                    style={{border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', color: '#ef4444'}}
                                                    title="Eliminar"
                                                >
                                                    🗑️
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
                        backgroundColor: 'white', padding: '24px', borderRadius: '16px', 
                        maxWidth: '500px', width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{marginTop: 0}}>{editingId ? 'Editar Cita' : 'Nueva Cita'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{marginBottom: '12px'}}>
                                <label style={{display:'block', marginBottom:'4px', fontWeight: '500'}}>Paciente:</label>
                                <select 
                                    name="patientId" 
                                    value={formData.patientId} 
                                    onChange={handleInputChange} 
                                    required
                                    style={{width:'100%', padding:'10px', borderRadius: '8px', border: '1px solid #ddd'}}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} - {p.cedula}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div style={{display: 'flex', gap: '12px', marginBottom: '12px'}}>
                                <div style={{flex: 1}}>
                                    <label style={{display:'block', marginBottom:'4px', fontWeight: '500'}}>Fecha:</label>
                                    <input 
                                        type="date" 
                                        name="date" 
                                        value={formData.date} 
                                        onChange={handleInputChange} 
                                        required 
                                        style={{width:'100%', padding:'10px', borderRadius: '8px', border: '1px solid #ddd'}}
                                    />
                                </div>
                                <div style={{flex: 1}}>
                                    <label style={{display:'block', marginBottom:'4px', fontWeight: '500'}}>Hora:</label>
                                    <input 
                                        type="time" 
                                        name="time" 
                                        value={formData.time} 
                                        onChange={handleInputChange} 
                                        required 
                                        style={{width:'100%', padding:'10px', borderRadius: '8px', border: '1px solid #ddd'}}
                                    />
                                </div>
                            </div>

                            <div style={{marginBottom: '12px'}}>
                                <label style={{display:'block', marginBottom:'4px', fontWeight: '500'}}>Tipo de Terapia:</label>
                                <select 
                                    name="type" 
                                    value={formData.type} 
                                    onChange={handleInputChange} 
                                    style={{width:'100%', padding:'10px', borderRadius: '8px', border: '1px solid #ddd'}}
                                >
                                    <option value="Físico">Física</option>
                                    <option value="Ocupacional">Ocupacional</option>
                                    <option value="Combinada">Combinada</option>
                                </select>
                            </div>

                            {editingId && (
                                <div style={{marginBottom: '12px'}}>
                                    <label style={{display:'block', marginBottom:'4px', fontWeight: '500'}}>Estado:</label>
                                    <select 
                                        name="status" 
                                        value={formData.status} 
                                        onChange={handleInputChange} 
                                        style={{width:'100%', padding:'10px', borderRadius: '8px', border: '1px solid #ddd'}}
                                    >
                                        <option value="scheduled">Programada</option>
                                        <option value="attended">Asistió</option>
                                        <option value="cancelled">Cancelada</option>
                                        <option value="no_show">No Asistió</option>
                                    </select>
                                </div>
                            )}

                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px'}}>
                                <button type="button" onClick={() => setShowModal(false)} style={{padding: '10px 20px', border: 'none', background: '#f5f5f5', borderRadius: '8px', cursor: 'pointer'}}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" style={{padding: '10px 20px', border: 'none', background: '#111', color: 'white', borderRadius: '8px', cursor: 'pointer'}}>
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
