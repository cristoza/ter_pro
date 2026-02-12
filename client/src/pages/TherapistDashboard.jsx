import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import CalendarView from '../components/CalendarView';

const TherapistDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // Default to list/daily view per request
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [editForm, setEditForm] = useState({ status: '', notes: '' });

    useEffect(() => {
        // Get user from local storage
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setCurrentUser(user);
                fetchAppointments(user);
            } else {
                setLoading(false);
            }
        } catch (e) {
            console.error('Error parsing user', e);
            setLoading(false);
        }
    }, []);

    const fetchAppointments = async (user) => {
        try {
            // Use specialized endpoint for therapist's own appointments
            const response = await api.get('/therapist/appointments');
            setAppointments(Array.isArray(response.data) ? response.data : []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching appointments', error);
            setLoading(false);
        }
    };

    const handleSlotClick = (appt) => {
        setSelectedAppt(appt);
        setEditForm({
            status: appt.status || 'scheduled',
            notes: appt.notes || ''
        });
        setShowEditModal(true);
    };

    const handleSaveUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/therapist/appointments/${selectedAppt.id}`, editForm);
            setShowEditModal(false);
            setSelectedAppt(null);
            // Refresh list
            fetchAppointments(currentUser);
            toast.success('Cita actualizada');
        } catch (error) {
            console.error('Error updating appointment:', error);
            toast.error('Error al actualizar cita');
        }
    };

    // Filter appointments for the selected date
    const dailyAppointments = useMemo(() => {
        if (!selectedDate) return appointments;
        return appointments.filter(appt => appt.date === selectedDate);
    }, [appointments, selectedDate]);

    // Calculate stats
    const dailyStats = useMemo(() => {
        return {
            total: dailyAppointments.length,
            completed: dailyAppointments.filter(a => a.status === 'completed').length,
            pending: dailyAppointments.filter(a => a.status === 'scheduled' || !a.status).length,
            cancelled: dailyAppointments.filter(a => ['cancelled', 'no_show'].includes(a.status)).length
        };
    }, [dailyAppointments]);

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="therapist-container">
            <div className="therapist-header">
                <h1>Panel de Terapistas - {currentUser?.username}</h1>
                <p className="muted">Gestión de terapias y horario</p>
            </div>

            <div style={{marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'}}>
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
                        Control Diario
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

                {viewMode === 'list' && (
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <label style={{fontWeight: 'bold'}}>Fecha:</label>
                        <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}
                        />
                        <button 
                            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                            className="btn btn-sm btn-secondary"
                        >
                            Hoy
                        </button>
                    </div>
                )}
            </div>
            
            <div className="card">
                {viewMode === 'calendar' ? (
                     <div style={{overflowX: 'auto'}}>
                        <CalendarView appointments={appointments} onSlotClick={handleSlotClick} />
                     </div>
                ) : (
                <>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px'}}>
                    <div style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #3b82f6'}}>
                        <div style={{color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px'}}>Total Sesiones</div>
                        <div style={{fontSize: '24px', fontWeight: 'bold'}}>{dailyStats.total}</div>
                    </div>
                    <div style={{background: '#f0fdf4', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #22c55e'}}>
                        <div style={{color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px'}}>Completadas</div>
                        <div style={{fontSize: '24px', fontWeight: 'bold', color: '#15803d'}}>{dailyStats.completed}</div>
                    </div>
                    <div style={{background: '#fff7ed', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #f97316'}}>
                        <div style={{color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px'}}>Pendientes</div>
                        <div style={{fontSize: '24px', fontWeight: 'bold', color: '#c2410c'}}>{dailyStats.pending}</div>
                    </div>
                    <div style={{background: '#fef2f2', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ef4444'}}>
                        <div style={{color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px'}}>Canceladas</div>
                        <div style={{fontSize: '24px', fontWeight: 'bold', color: '#b91c1c'}}>{dailyStats.cancelled}</div>
                    </div>
                </div>

                <h2>Resumen del Día - {new Date(selectedDate).toLocaleDateString()}</h2>
                {dailyAppointments.length === 0 ? (
                    <p className="muted">No hay citas registradas para este día.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Hora</th>
                                    <th>Paciente</th>
                                    <th>Notas</th>
                                    <th>Estado</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyAppointments.map(appt => (
                                    <tr key={appt.id}>
                                        <td>{appt.time}</td>
                                        <td>{appt.patient ? appt.patient.name : (appt.patientName || 'N/A')}</td>
                                        <td>{appt.notes || '-'}</td>
                                        <td>
                                            <span className={`status-badge status-${appt.status}`}>
                                                {appt.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-sm btn-primary" onClick={() => handleSlotClick(appt)}>
                                                Editar
                                            </button>
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

            {showEditModal && selectedAppt && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '600px', maxWidth: '90%'}}>
                        <h3>Actualizar Cita</h3>
                        <p><strong>Paciente:</strong> {selectedAppt.patient ? selectedAppt.patient.name : selectedAppt.patientName}</p>
                        <p><strong>Fecha:</strong> {new Date(selectedAppt.date).toLocaleDateString()} at {selectedAppt.time}</p>
                        
                        <form onSubmit={handleSaveUpdate}>
                            <div style={{marginBottom: '12px'}}>
                                <label style={{display: 'block', marginBottom: '4px'}}>Estado:</label>
                                <select 
                                    value={editForm.status}
                                    onChange={(e) => setEditForm(prev => ({...prev, status: e.target.value}))}
                                    style={{width: '100%', padding: '8px'}}
                                >
                                    <option value="scheduled">Programada</option>
                                    <option value="completed">Completada</option>
                                    <option value="cancelled">Cancelada</option>
                                    <option value="no_show">No Asistió</option>
                                </select>
                            </div>
                            
                            <div style={{marginBottom: '12px'}}>
                                <label style={{display: 'block', marginBottom: '4px'}}>Notas de Evolución:</label>
                                <textarea 
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm(prev => ({...prev, notes: e.target.value}))}
                                    style={{width: '100%', padding: '8px', minHeight: '100px'}}
                                    placeholder="Ingrese notas sobre la sesión..."
                                />
                            </div>

                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px'}}>
                                <button type="button" onClick={() => setShowEditModal(false)} style={{padding: '8px 16px', background: '#ccc', border: 'none'}}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" style={{padding: '8px 16px'}}>Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TherapistDashboard;
