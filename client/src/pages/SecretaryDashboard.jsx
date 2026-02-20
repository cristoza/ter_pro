import { useState, useEffect } from 'react';
import api from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import NotificationCenter from '../components/NotificationCenter';

const SecretaryDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [therapists, setTherapists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Filters
    const [filterDate, setFilterDate] = useState('');
    const [filterPatient, setFilterPatient] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'asc' });

    // Editing State
    const [showModal, setShowModal] = useState(false);
    const [editingAppt, setEditingAppt] = useState(null);
    const [editForm, setEditForm] = useState({
        date: '',
        time: '',
        status: '',
        therapistId: '',
        notes: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Fetch independently to identify failures
            let apptData = [];
            let therapistData = [];

            try {
                const res = await api.get('/api/secretary/appointments');
                apptData = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
            } catch (e) {
                console.error('Appointments API failed:', e);
                const backendMsg = e.response?.data?.message || 'Sin mensaje';
                const backendError = e.response?.data?.error || '';
                const backendDetail = e.response?.data?.detail || '';
                throw new Error(`Error Citas: ${backendMsg} - ${backendError} ${backendDetail} : ${e.message}`);
            }

            try {
                const res = await api.get('/api/secretary/therapists');
                therapistData = res.data;
            } catch (e) {
                console.error('Therapists API failed:', e);
                throw new Error(`Error cargando terapeutas: ${e.response?.data?.message || e.message}`);
            }

            setAppointments(apptData);
            setFilteredAppointments(apptData);
            setTherapists(therapistData);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Connect to Socket.IO
        const socket = socketService.connect();

        socket.on('appointment:created', (newAppt) => {
            setAppointments(prev => [...prev, newAppt]);
            // Use patientName field as fallback if relation is missing
            const pName = newAppt.patient?.name || newAppt.patientName || 'Paciente';
            toast.success(`Nueva Cita: ${pName} - ${newAppt.date}`, {
                duration: 5000,
                position: 'top-right',
                style: { border: '1px solid #10B981', padding: '16px', color: '#065F46' },
                iconTheme: { primary: '#10B981', secondary: '#FFFAEE' },
            });
        });

        socket.on('appointment:updated', (updatedAppt) => {
            setAppointments(prev => prev.map(a => a.id === updatedAppt.id ? updatedAppt : a));
            toast('Cita Actualizada', {
                icon: '🔄',
                position: 'top-right',
                duration: 3000
            });
        });

        socket.on('appointment:deleted', ({ id }) => {
            setAppointments(prev => prev.filter(a => a.id !== Number(id)));
            toast('Cita Cancelada', {
                icon: '🗑️',
                position: 'top-right',
                duration: 3000
            });
        });

        return () => {
            socket.off('appointment:created');
            socket.off('appointment:updated');
            socket.off('appointment:deleted');
            socketService.disconnect();
        };
    }, []);

    useEffect(() => {
        // Create a shallow copy to prevent state mutation and ensure re-renders
        let result = [...appointments];
        
        if (filterDate) {
            result = result.filter(a => a.date && a.date.startsWith(filterDate));
        }
        if (filterPatient) {
            const lowerQuery = filterPatient.toLowerCase();
            result = result.filter(a => 
                (a.patient && a.patient.name.toLowerCase().includes(lowerQuery)) ||
                (a.patientName && a.patientName.toLowerCase().includes(lowerQuery))
            );
        }
        if (filterStatus) {
            result = result.filter(a => a.status === filterStatus);
        }

        // Sorting Logic
        result.sort((a, b) => {
            if (sortConfig.key === 'date') {
                // Primary sort by date
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                let diff = dateA - dateB;

                // Secondary sort by time if dates are equal
                if (diff === 0 && a.time && b.time) {
                    diff = a.time.localeCompare(b.time);
                }
                
                return sortConfig.direction === 'asc' ? diff : -diff;
            }
            return 0;
        });

        setFilteredAppointments(result);
    }, [appointments, filterDate, filterPatient, filterStatus, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleEditClick = (appt) => {
        setEditingAppt(appt);
        setEditForm({
            date: appt.date ? appt.date.substring(0, 10) : '',
            time: appt.time ? appt.time.substring(0, 5) : '',
            status: appt.status,
            therapistId: appt.therapistId || (appt.therapist ? appt.therapist.id : ''),
            notes: appt.notes || ''
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/secretary/api/appointments/${editingAppt.id}`, editForm);
            
            toast.success('Cita actualizada correctamente');
            setShowModal(false);
            setEditingAppt(null);
            fetchData();
        } catch (err) {
            console.error('Error updating appointment:', err);
            toast.error(err.response?.data?.message || 'Error al actualizar la cita');
        }
    };

    const handlePrint = (appt) => {
        const publicId = appt.patient?.publicId || appt.patientPublicId;
        if (publicId) {
            // Check if there's a batchId to group the print
            const batchParam = appt.batchId ? `?batchId=${appt.batchId}` : '';
            window.open(`/portal/patient/${publicId}/pdf${batchParam}`, '_blank');
        } else {
            toast.error('No se puede generar PDF: ID de paciente faltante');
        }
    };

    if (error) return (
        <div style={{padding:'20px', color:'red', textAlign:'center'}}>
            <h3>Error del Sistema</h3>
            <pre style={{textAlign:'left', background:'#fee', padding:'10px', overflow:'auto'}}>
                {error}
            </pre>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
        </div>
    );

    return (
        <div style={{maxWidth: '1200px', margin: '0 auto', padding: '20px'}}>
            <div style={{marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                    <h1>Panel de Secretaría</h1>
                    <p className="muted">Gestión de citas y recepción de pacientes</p>
                </div>
                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                    <NotificationCenter role="secretary" />
                     <button 
                        className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('overview')}
                        style={activeTab !== 'overview' ? {background:'#e2e8f0', color:'#334155'} : {}}
                    >
                        Resumen
                    </button>
                    <button 
                        className={`btn ${activeTab === 'appointments' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('appointments')}
                        style={activeTab !== 'appointments' ? {background:'#e2e8f0', color:'#334155'} : {}}
                    >
                        Gestión de Citas
                    </button>
                </div>
            </div>

            {activeTab === 'overview' ? (
                <div className="grid-2">
                    <div className="card">
                        <h2>Resumen</h2>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <div className="stat-value">{appointments.length}</div>
                                <div className="stat-label">Citas Totales</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{therapists.length}</div>
                                <div className="stat-label">Terapistas</div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h2>Próximas Citas</h2>
                        {appointments.length === 0 ? (
                            <p className="text-center muted">No hay citas registradas.</p>
                        ) : (
                            <div className="table-responsive" style={{maxHeight: '400px', overflowY: 'auto'}}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Fecha/Hora</th>
                                            <th>Paciente</th>
                                            <th>Terapeuta</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appointments.slice(0, 10).map(appt => (
                                            <tr key={appt.id}>
                                                <td>
                                                    <div>{new Date(appt.date).toLocaleDateString()}</div>
                                                    <small className="muted">{appt.time}</small>
                                                </td>
                                                <td>{appt.patient ? appt.patient.name : 'N/A'}</td>
                                                <td>{appt.therapist ? appt.therapist.name : 'N/A'}</td>
                                                <td>
                                                    <span className={`status-badge status-${appt.status}`}>
                                                        {appt.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div style={{marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap'}}>
                        <div style={{flex: '1 1 300px'}}>
                            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Buscar Paciente</label>
                            <input 
                                type="text" 
                                placeholder="Nombre del paciente..."
                                value={filterPatient}
                                onChange={(e) => setFilterPatient(e.target.value)}
                                style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
                            />
                        </div>
                        <div style={{flex: '0 0 auto'}}>
                            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Filtrar por Fecha</label>
                            <input 
                                type="date" 
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                style={{padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
                            />
                        </div>
                        <div style={{flex: '0 0 auto'}}>
                            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Estado</label>
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px'}}
                            >
                                <option value="">Todos</option>
                                <option value="scheduled">Programada</option>
                                <option value="completed">Completada</option>
                                <option value="cancelled">Cancelada</option>
                                <option value="no_show">No Asistió</option>
                            </select>
                        </div>
                        <button 
                            className="btn btn-secondary"
                            onClick={() => {setFilterDate(''); setFilterPatient(''); setFilterStatus('');}}
                            style={{height:'37px'}}
                        >
                            Limpiar Filtros
                        </button>
                    </div>

                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('date')} style={{cursor: 'pointer', userSelect: 'none'}}>
                                        Fecha {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th>Hora</th>
                                    <th>Paciente</th>
                                    <th>Terapeuta</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>
                                            No se encontraron citas con los filtros actuales.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAppointments.map(appt => (
                                        <tr key={appt.id}>
                                            <td>{new Date(appt.date).toLocaleDateString()}</td>
                                            <td>{appt.time ? appt.time.substring(0, 5) : ''}</td>
                                            <td><strong>{appt.patient ? appt.patient.name : (appt.patientName || 'N/A')}</strong></td>
                                            <td>{appt.therapist ? appt.therapist.name : 'N/A'}</td>
                                            <td>
                                                <span className={`status-badge status-${appt.status}`}>
                                                    {appt.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    className="btn btn-small"
                                                    style={{backgroundColor: '#2196F3', color: 'white', marginRight: '5px'}}
                                                    onClick={() => handleEditClick(appt)}
                                                >
                                                    Editar
                                                </button>
                                                <button 
                                                    className="btn btn-small"
                                                    style={{backgroundColor: '#555', color: 'white'}}
                                                    onClick={() => handlePrint(appt)}
                                                    title="Imprimir Detalles / Horario"
                                                >
                                                    🖨️
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '500px',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <h2 style={{marginTop: 0}}>Editar Cita</h2>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Fecha</label>
                                <input 
                                    type="date"
                                    required
                                    value={editForm.date}
                                    onChange={e => setEditForm({...editForm, date: e.target.value})}
                                    style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius:'4px'}}
                                />
                            </div>
                            <div className="form-group">
                                <label>Hora</label>
                                <input 
                                    type="time"
                                    required
                                    value={editForm.time}
                                    onChange={e => setEditForm({...editForm, time: e.target.value})}
                                    style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius:'4px'}}
                                />
                            </div>
                            <div className="form-group">
                                <label>Estado</label>
                                <select 
                                    value={editForm.status}
                                    onChange={e => setEditForm({...editForm, status: e.target.value})}
                                    style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius:'4px'}}
                                >
                                    <option value="scheduled">Programada</option>
                                    <option value="completed">Completada</option>
                                    <option value="cancelled">Cancelada</option>
                                    <option value="no_show">No Asistió</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Terapeuta</label>
                                <select 
                                    value={editForm.therapistId}
                                    onChange={e => setEditForm({...editForm, therapistId: e.target.value})}
                                    style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius:'4px'}}
                                >
                                    <option value="">Seleccionar Terapista</option>
                                    {therapists.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Notas</label>
                                <textarea 
                                    value={editForm.notes}
                                    onChange={e => setEditForm({...editForm, notes: e.target.value})}
                                    rows="3"
                                    style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius:'4px'}}
                                />
                            </div>

                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px'}}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecretaryDashboard;
