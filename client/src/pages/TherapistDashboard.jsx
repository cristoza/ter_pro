import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import './TherapistDashboard.css';

const TherapistDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [displayDate, setDisplayDate] = useState(new Date()); // For Calendar month view
    const [selectedDate, setSelectedDate] = useState(new Date()); // For Agenda
    
    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [editForm, setEditForm] = useState({ status: '', notes: '' });

    useEffect(() => {
        // Reset time parts
        const today = new Date();
        today.setHours(0,0,0,0);
        setSelectedDate(today);
        
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

    const fetchAppointments = async () => {
        try {
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
            fetchAppointments();
            toast.success('Cita actualizada');
        } catch (error) {
            console.error('Error updating appointment:', error);
            toast.error('Error al actualizar cita');
        }
    };

    // --- Helpers for Calendar ---
    
    const formatDateIso = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formattedSelectedDate = useMemo(() => formatDateIso(selectedDate), [selectedDate]);
    const todayIso = useMemo(() => formatDateIso(new Date()), []);

    // Filter appointments for the selected date
    const dailyAppointments = useMemo(() => {
        return appointments.filter(appt => appt.date === formattedSelectedDate).sort((a,b) => a.time.localeCompare(b.time));
    }, [appointments, formattedSelectedDate]);

    // Calculate stats
    const stats = useMemo(() => {
        return {
            today: appointments.filter(a => a.date === todayIso).length,
            upcoming: appointments.filter(a => a.date > todayIso).length
        };
    }, [appointments, todayIso]);

    
    // Calendar Generation
    const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    
    const calendarDays = useMemo(() => {
        const year = displayDate.getFullYear();
        const month = displayDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const daysInMonth = lastDay.getDate();
        let startDay = firstDay.getDay() - 1; // 0=Mon, 6=Sun
        if (startDay === -1) startDay = 6;
        
        const days = [];
        // Empty slots
        for(let i=0; i<startDay; i++) days.push(null);
        // Days
        for(let d=1; d<=daysInMonth; d++) days.push(new Date(year, month, d));
        
        return days;
    }, [displayDate]);

    const handlePrevMonth = () => {
        const newDate = new Date(displayDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setDisplayDate(newDate);
    };
    
    const handleNextMonth = () => {
        const newDate = new Date(displayDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setDisplayDate(newDate);
    };

    if (loading) return <div>Cargando...</div>;

    const selectedSpanishDate = selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div className="header-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <div>
                    <h1>Agenda de Terapeutas</h1>
                    <p className="subtitle">Visualiza y gestiona las citas programadas</p>
                </div>
            </div>

            <div className="therapist-selection-card">
                <label>Seleccionar Terapeuta</label>
                <div className="fake-select">
                    {currentUser?.username || 'Terapeuta'} - {currentUser?.specialty || 'Físico'}
                </div>
            </div>
            
            <div className="dashboard-grid">
                {/* Left Column */}
                <div className="left-column">
                    <div className="stats-row">
                        <div className="stat-card">
                            <h3>Citas Hoy</h3>
                            <span className="stat-value">{stats.today}</span>
                        </div>
                        <div className="stat-card">
                            <h3>Próximas Citas</h3>
                            <span className="stat-value">{stats.upcoming}</span>
                        </div>
                    </div>
                    
                    <div className="specialty-card">
                        <h3>Especialidad</h3>
                        <span className="specialty-value">{currentUser?.specialty || 'Físico'}</span>
                    </div>
                    
                    <div className="calendar-widget">
                        <div style={{marginBottom: '1rem'}}>
                            <p style={{margin: 0, fontWeight: 600}}>Calendario</p>
                            <p style={{margin: 0, fontSize: '0.9rem', color: '#6c757d'}}>Selecciona una fecha</p>
                        </div>
                        
                        <div className="calendar-header">
                            <button onClick={handlePrevMonth}>&lt;</button>
                            <span className="current-month-year">{monthNames[displayDate.getMonth()]} {displayDate.getFullYear()}</span>
                            <button onClick={handleNextMonth}>&gt;</button>
                        </div>
                        
                        <div className="weekdays">
                            <div>lu</div><div>ma</div><div>mi</div><div>ju</div><div>vi</div><div>sá</div><div>do</div>
                        </div>
                        
                        <div className="days-grid">
                            {calendarDays.map((date, idx) => {
                                if (!date) return <div key={idx} className="day-cell empty"></div>;
                                
                                const dateIso = formatDateIso(date);
                                const isSelected = dateIso === formattedSelectedDate;
                                const isToday = dateIso === todayIso;
                                
                                return (
                                    <div 
                                        key={idx} 
                                        className={`day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                                        onClick={() => setSelectedDate(date)}
                                    >
                                        {date.getDate()}
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="day-message">
                            <div style={{fontWeight: 'bold', textTransform: 'capitalize', marginBottom: '4px'}}>
                                {selectedSpanishDate}
                            </div>
                            <div style={{color: '#6c757d'}}>
                                {dailyAppointments.length} citas programadas
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Right Column (Agenda) */}
                <div className="agenda-column">
                    <div className="agenda-card">
                        <div className="agenda-header">
                            <h2>Agenda del Día</h2>
                            <p className="selected-date-display">Citas programadas para {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
                        </div>
                        
                        <div className="appointments-list">
                            {dailyAppointments.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📅</div>
                                    <p>No hay citas programadas para este día</p>
                                </div>
                            ) : (
                                dailyAppointments.map((appt, i) => (
                                    <div key={appt.id || i} className="appointment-item" onClick={() => handleSlotClick(appt)}>
                                        <div className="time-slot">{appt.time ? appt.time.slice(0,5) : '--:--'}</div>
                                        <div className="appointment-details">
                                            <div className="patient-name-row">
                                                <span className="patient-name">
                                                    {appt.patient ? appt.patient.name : (appt.patientName || 'Paciente')}
                                                </span>
                                                {appt.patient && appt.patient.type === 'R' && (
                                                    <span style={{
                                                        fontSize: '0.7em', 
                                                        color: '#d32f2f', 
                                                        backgroundColor: '#ffebee', 
                                                        padding: '1px 5px', 
                                                        borderRadius: '4px',
                                                        fontWeight: 'bold',
                                                        border: '1px solid #ffcdd2',
                                                        marginLeft: '6px'
                                                    }}>Tipo R</span>
                                                )}
                                                {appt.status && <span className={`status-indicator ${appt.status}`}></span>}
                                            </div>
                                            <div className="patient-info">
                                                Duración: {appt.durationMinutes} min
                                                <br />
                                                <span className="machine-badge">{appt.machine ? appt.machine.type : 'General'}</span>
                                                {appt.notes && <div style={{marginTop: '4px', fontStyle: 'italic'}}>{appt.notes}</div>}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && selectedAppt && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '600px', maxWidth: '90%'}}>
                        <h3>Actualizar Cita</h3>
                        <p><strong>Paciente:</strong> {selectedAppt.patient ? selectedAppt.patient.name : selectedAppt.patientName}</p>
                        <p><strong>Fecha:</strong> {new Date(selectedAppt.date).toLocaleDateString()} a las {selectedAppt.time}</p>
                        
                        <form onSubmit={handleSaveUpdate}>
                            <div style={{marginBottom: '12px'}}>
                                <label style={{display: 'block', marginBottom: '4px'}}>Estado:</label>
                                <select 
                                    value={editForm.status}
                                    onChange={(e) => setEditForm(prev => ({...prev, status: e.target.value}))}
                                    style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
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
                                    style={{width: '100%', padding: '8px', minHeight: '100px', borderRadius: '4px', border: '1px solid #ccc'}}
                                    placeholder="Ingrese notas sobre la sesión..."
                                />
                            </div>

                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px'}}>
                                <button type="button" onClick={() => setShowEditModal(false)} style={{padding: '8px 16px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Cancelar</button>
                                <button type="submit" style={{padding: '8px 16px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TherapistDashboard;
