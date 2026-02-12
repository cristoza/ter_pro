import { useState, useEffect } from 'react';
import api from '../services/api';
import CalendarView from '../components/CalendarView';
import toast from 'react-hot-toast';

const DoctorDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
    
    // Filters & Search
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        patientId: '',
        date: '',
        time: '',
        type: 'Físico',
        machineType: 'General',
        durationMinutes: 30,
        sessions: 1,
        preferredStartTime: '',
        preferredEndTime: ''
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    
    // Autocomplete State
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientResults, setShowPatientResults] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Doctors use the general API which might filter by their ID in a real app,
                // but for now we list what the endpoint gives us.
                const [apptRes, patientRes] = await Promise.all([
                    api.get('/api/appointments'),
                    api.get('/patients')
                ]);
                
                setAppointments(Array.isArray(apptRes.data) ? apptRes.data : []);
                setPatients(Array.isArray(patientRes.data) ? patientRes.data : []);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Error al cargar datos del panel.');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateAppointment = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setSubmitError(null);

        try {
            // Find selected patient to get name (backend might need it depending on implementation, 
            // but we patched it to take patientId. Providing patientName is just backup)
            const selectedPatient = patients.find(p => p.id === parseInt(formData.patientId));
            
            let response;
            if (parseInt(formData.sessions) > 1) {
                 const seriesPayload = {
                    ...formData,
                    patientName: selectedPatient ? selectedPatient.name : 'Unknown',
                    therapyType: formData.type,
                    occurrences: parseInt(formData.sessions),
                    startDate: formData.date
                };
                response = await api.post('/api/appointments/series', seriesPayload);
            } else {
                 const payload = {
                    ...formData,
                    patientName: selectedPatient ? selectedPatient.name : 'Unknown',
                    therapyType: formData.type
                };
                response = await api.post('/api/appointments', payload);
            }
            
            // Add new appointment(s) to list with necessary display fields
            let newItems = [];
            if (response.data.created) {
                // Wrapper format from single creation
                newItems = [response.data.created];
                if (response.data.related) newItems.push(response.data.related);
            } else if (Array.isArray(response.data)) {
                // Array from series creation
                newItems = response.data;
            } else {
                newItems = [response.data];
            }
            
            // Format new appointments to match list structure (ensure patient object exists)
            const formattedNewAppts = newItems.map(a => ({
                ...a,
                patient: a.patient || selectedPatient || { name: a.patientName || 'Unknown' } // Fallback to selected patient object
            }));
            
            setAppointments(prev => [...formattedNewAppts, ...prev]);
            setShowModal(false);
            setFormData({
                patientId: '',
                date: '',
                time: '',
                type: 'Físico',
                machineType: 'General',
                durationMinutes: 30,
                sessions: 1
            });
            setPatientSearch('');
            
            // Custom Alert with Assignment Details
            const uniqueTherapists = [...new Set(formattedNewAppts.map(a => a.therapist?.name).filter(Boolean))];
            const uniqueMachines = [...new Set(formattedNewAppts.map(a => a.machine?.name).filter(Boolean))];
            
            let msg = 'Cita(s) creada(s) exitosamente.\n\n';
            if (uniqueTherapists.length > 0) {
                msg += `Asignado a: ${uniqueTherapists.join(', ')}`;
            } else {
                msg += `Asignado a: (Pendiente/Automático)`;
            }
            
            if (uniqueMachines.length > 0) {
                msg += `\nRecurso: ${uniqueMachines.join(', ')}`;
            }
            toast.success(msg, { duration: 5000 });
        } catch (err) {
            console.error('Error creating appointment:', err);
            const msg = err.response?.data?.message || 'Error al crear la cita.';
            setSubmitError(msg);
            toast.error(msg);
        } finally {
            setSubmitLoading(false);
        }
    };

    // Filter logic
    const filteredAppointments = appointments.filter(appt => {
        const matchesStatus = filterStatus === 'all' || appt.status === filterStatus;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
            (appt.patientName && appt.patientName.toLowerCase().includes(searchLower)) ||
            (appt.patient?.name && appt.patient.name.toLowerCase().includes(searchLower));
        
        return matchesStatus && matchesSearch;
    });

    if (loading) return <div>Cargando panel médico...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div style={{maxWidth: '1100px', margin: '0 auto'}}>
            <div style={{textAlign: 'center', marginBottom: '32px'}}>
                <h1>Panel Médico</h1>
                <p className="muted">Gestión de historias clínicas y pacientes</p>
            </div>

            <div style={{marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div style={{display: 'flex', gap: '10px', backgroundColor: '#eee', padding: '4px', borderRadius: '8px'}}>
                    <button 
                        onClick={() => setViewMode('list')}
                        style={{
                            border: 'none', background: viewMode === 'list' ? 'white' : 'transparent',
                            padding: '6px 16px', borderRadius: '6px', cursor: 'pointer',
                            boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            fontWeight: viewMode === 'list' ? 'bold' : 'normal'
                        }}
                    >
                        Lista
                    </button>
                    <button 
                        onClick={() => setViewMode('calendar')}
                        style={{
                            border: 'none', background: viewMode === 'calendar' ? 'white' : 'transparent',
                            padding: '6px 16px', borderRadius: '6px', cursor: 'pointer',
                            boxShadow: viewMode === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            fontWeight: viewMode === 'calendar' ? 'bold' : 'normal'
                        }}
                    >
                        Calendario
                    </button>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + Nueva Cita
                </button>
            </div>
            
            <div className="card">
                {viewMode === 'calendar' ? (
                   <div style={{overflowX: 'auto'}}>
                        <CalendarView appointments={appointments} />
                   </div>
                ) : (
                <>
                <h2>Citas Programadas</h2>

                {/* Search and Filters */}
                <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                    <input 
                        type="text" 
                        placeholder="🔍 Buscar paciente..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: 1}}
                    />
                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="scheduled">Programada</option>
                        <option value="completed">Completada</option>
                        <option value="cancelled">Cancelada</option>
                    </select>
                </div>

                {filteredAppointments.length === 0 ? (
                    <p className="text-center muted">No se encontraron citas.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Hora</th>
                                    <th>Paciente</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.map(appt => (
                                    <tr key={appt.id}>
                                        <td>{new Date(appt.date).toLocaleDateString()}</td>
                                        <td>{appt.time}</td>
                                        <td>{appt.patient ? appt.patient.name : appt.patientName}</td>
                                        <td>
                                            <span className={`status-badge status-${appt.status}`}>
                                                {appt.status === 'no_show' ? 'No Asistió' : appt.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                </>
                )}
            </div>

            {/* Simple Modal */}
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
                        <h3>Nueva Cita</h3>
                        {submitError && <div className="error-message" style={{marginBottom: '10px'}}>{submitError}</div>}
                        
                        <form onSubmit={handleCreateAppointment}>
                            <div style={{marginBottom: '12px', position: 'relative'}}>
                                <label style={{display: 'block', marginBottom: '4px'}}>Paciente:</label>
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o cédula..."
                                    value={patientSearch}
                                    onChange={(e) => {
                                        setPatientSearch(e.target.value);
                                        setShowPatientResults(true);
                                        setFormData(prev => ({...prev, patientId: ''}));
                                    }}
                                    onFocus={() => setShowPatientResults(true)}
                                    style={{width: '100%', padding: '8px'}}
                                    required={!formData.patientId} // Required only if ID not set
                                />
                                {showPatientResults && patientSearch && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        backgroundColor: 'white', border: '1px solid #ddd',
                                        maxHeight: '150px', overflowY: 'auto', zIndex: 10
                                    }}>
                                        {patients.filter(p => 
                                            p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
                                            p.cedula.includes(patientSearch)
                                        ).map(p => (
                                            <div 
                                                key={p.id}
                                                onClick={() => {
                                                    setFormData(prev => ({...prev, patientId: p.id}));
                                                    setPatientSearch(`${p.name} (${p.cedula})`);
                                                    setShowPatientResults(false);
                                                }}
                                                style={{padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee'}}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                            >
                                                {p.name} <small className="muted">({p.cedula})</small>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {formData.patientId && <small style={{color: 'green'}}>Paciente seleccionado ✓</small>}
                            </div>

                            <div style={{display: 'flex', gap: '12px', marginBottom: '12px'}}>
                                <div style={{flex: 1}}>
                                    <label style={{display: 'block', marginBottom: '4px'}}>Fecha:</label>
                                    <input 
                                        type="date" 
                                        name="date" 
                                        value={formData.date} 
                                        onChange={handleInputChange}
                                        style={{width: '100%', padding: '8px'}}
                                        placeholder="Opcional (Auto-asignar)"
                                    />
                                </div>
                                <div style={{flex: 1}}>
                                    <label style={{display: 'block', marginBottom: '4px'}}>Hora:</label>
                                    <input 
                                        type="time" 
                                        name="time" 
                                        value={formData.time} 
                                        onChange={handleInputChange}
                                        style={{width: '100%', padding: '8px'}}
                                        placeholder="Opcional"
                                    />
                                </div>
                            </div>
                            <div style={{fontSize: '0.8em', color: '#666', marginTop: '-8px', marginBottom: '12px'}}>
                                * Dejar fecha/hora en blanco para ser asignado por el algoritmo inteligente.
                            </div>

                            {(!formData.date || !formData.time) && (
                                <div style={{backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '4px', marginBottom: '12px', border: '1px dashed #ccc'}}>
                                    <label style={{display: 'block', fontSize: '0.9em', fontWeight: 'bold', marginBottom: '8px'}}>Preferencias de Auto-Asignación:</label>
                                    <div style={{display: 'flex', gap: '12px'}}>
                                        <div style={{flex: 1}}>
                                            <label style={{display: 'block', marginBottom: '4px', fontSize: '0.9em'}}>Desde las:</label>
                                            <input 
                                                type="time" 
                                                name="preferredStartTime" 
                                                value={formData.preferredStartTime} 
                                                onChange={handleInputChange}
                                                style={{width: '100%', padding: '6px'}}
                                            />
                                        </div>
                                        <div style={{flex: 1}}>
                                            <label style={{display: 'block', marginBottom: '4px', fontSize: '0.9em'}}>Hasta las:</label>
                                            <input 
                                                type="time" 
                                                name="preferredEndTime" 
                                                value={formData.preferredEndTime} 
                                                onChange={handleInputChange}
                                                style={{width: '100%', padding: '6px'}}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{display: 'flex', gap: '12px', marginBottom: '12px'}}>
                                <div style={{flex: 1}}>
                                    <label style={{display: 'block', marginBottom: '4px'}}>Tipo de Terapia:</label>
                                    <select 
                                        name="type" 
                                        value={formData.type} 
                                        onChange={handleInputChange}
                                        style={{width: '100%', padding: '8px'}}
                                    >
                                        <option value="Físico">Física</option>
                                        <option value="Ocupacional">Ocupacional</option>
                                        <option value="Combinada">Combinada</option>
                                    </select>
                                </div>
                                <div style={{flex: 1}}>
                                    <label style={{display: 'block', marginBottom: '4px'}}>Equipo/Recurso:</label>
                                    <select 
                                        name="machineType" 
                                        value={formData.machineType} 
                                        onChange={handleInputChange}
                                        style={{width: '100%', padding: '8px'}}
                                    >
                                        <option value="General">Cubículo Estándar</option>
                                        <option value="Gym">Gimnasio</option>
                                        <option value="Laser">Láser</option>
                                        <option value="Magneto">Magneto</option>
                                        <option value="Ultrasound">Ultrasonido</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{display: 'flex', gap: '12px', marginBottom: '12px'}}>
                                <div style={{flex: 1}}>
                                    <label style={{display: 'block', marginBottom: '4px'}}>Sesiones:</label>
                                    <select 
                                        name="sessions" 
                                        value={formData.sessions} 
                                        onChange={handleInputChange}
                                        style={{width: '100%', padding: '8px'}}
                                    >
                                        <option value="1">1 (Individual)</option>
                                        <option value="5">5 Sesiones</option>
                                        <option value="10">10 Sesiones</option>
                                    </select>
                                </div>
                                <div style={{flex: 1}}>
                                    <label style={{display: 'block', marginBottom: '4px'}}>Duración:</label>
                                    <select
                                        name="durationMinutes"
                                        value={formData.durationMinutes}
                                        onChange={handleInputChange}
                                        style={{width: '100%', padding: '8px'}}
                                    >
                                        <option value="30">30 min</option>
                                        <option value="45">45 min</option>
                                        <option value="60">60 min</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px'}}>
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    style={{padding: '8px 16px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={submitLoading}
                                    className="btn btn-primary"
                                    style={{padding: '8px 16px'}}
                                >
                                    {submitLoading ? 'Creando...' : 'Crear Cita'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorDashboard;
