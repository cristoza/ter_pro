import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AdminTherapists = () => {
    const [therapists, setTherapists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // Schedule builder state
    const [schedule, setSchedule] = useState({
        days: [],
        start: '08:00',
        end: '16:00'
    });

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        specialty: 'Físico', // Default
        email: '',
        phone: '',
        workingHours: '',
        password: 'password123' // Default initial password
    });

    useEffect(() => {
        fetchTherapists();
    }, []);

    const fetchTherapists = async () => {
        try {
            const response = await api.get('/therapists');
            setTherapists(Array.isArray(response.data) ? response.data : []);
            setLoading(false);
        } catch (err) {
            console.error('Error loading therapists:', err);
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEdit = (therapist) => {
        setEditingId(therapist.id);
        const wh = therapist.workingHours || '';
        
        setFormData({
            name: therapist.name,
            specialty: therapist.specialty,
            email: therapist.email || '',
            phone: therapist.phone || '',
            workingHours: wh,
            password: '' // Don't show password, leave empty to not change
        });
        
        // Attempt to parse schedule string "Lunes, Martes: 08:00 - 16:00"
        try {
            if (wh.includes(':') && wh.includes('-')) {
                const [daysPart, timePart] = wh.split(': ');
                const [start, end] = timePart.split(' - ');
                const days = daysPart.split(', ');
                setSchedule({ days, start, end });
            } else {
                setSchedule({ days: [], start: '08:00', end: '16:00' });
            }
        } catch (e) {
            setSchedule({ days: [], start: '08:00', end: '16:00' });
        }
        
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este terapeuta?')) return;
        try {
            await api.delete(`/therapists/${id}`);
            // Optimistic update
            setTherapists(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error('Error deleting therapist:', error);
            toast.error('Error al eliminar terapeuta');
        }
    };

    const openNewModal = () => {
        setEditingId(null);
        setSchedule({ days: [], start: '08:00', end: '16:00' });
        setFormData({
            name: '',
            specialty: 'Físico',
            email: '',
            phone: '',
            workingHours: '',
            password: 'password123'
        });
        setShowModal(true);
    };

    const updateSchedule = (newSchedule) => {
        setSchedule(newSchedule);
        if (newSchedule.days.length > 0) {
            const timeString = `${newSchedule.days.join(', ')}: ${newSchedule.start} - ${newSchedule.end}`;
            setFormData(prev => ({ ...prev, workingHours: timeString }));
        } else {
            setFormData(prev => ({ ...prev, workingHours: '' }));
        }
    };

    const toggleDay = (day) => {
        const days = schedule.days.includes(day)
            ? schedule.days.filter(d => d !== day)
            : [...schedule.days, day];
        
        const weekOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        days.sort((a, b) => weekOrder.indexOf(a) - weekOrder.indexOf(b));
        
        updateSchedule({ ...schedule, days });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Update
                const payload = { ...formData };
                if (!payload.password) delete payload.password; // Don't send empty password
                // Ensure email is null if empty string
                if (!payload.email || payload.email.trim() === '') {
                    payload.email = null;
                }
                
                // Optimistic Update
                setTherapists(prev => prev.map(t => t.id === editingId ? { ...t, ...payload } : t));
                
                await api.put(`/therapists/${editingId}`, payload);
                toast.success('Terapeuta actualizado exitosamente');
            } else {
                // Create
                const payload = { ...formData };
                // Ensure email is null if empty string to avoid validation/db issues
                if (!payload.email || payload.email.trim() === '') {
                    delete payload.email;
                }
                
                const response = await api.post('/therapists', payload);
                setTherapists(prev => [...prev, response.data]);
                toast.success('Terapeuta creado exitosamente');
            }
            setShowModal(false);
            setEditingId(null);
        } catch (err) {
            console.error('Error saving therapist:', err);
            const data = err.response?.data;
            let msg = data?.message || data?.error || 'Error al guardar terapeuta';
            
            // Append validation details if available
            if (data?.errors && Array.isArray(data.errors)) {
                msg += ': ' + data.errors.join(', ');
            }
            
            toast.error(msg);
        }
    };

    return (
        <div className="admin-view">
            <div className="page-header">
                <h1>Gestión de Terapistas</h1>
                <p>Administra el personal de terapia del hospital</p>
                <button className="btn btn-primary" onClick={openNewModal}>
                    <span>+</span> Nuevo Terapista
                </button>
            </div>
            
            <div className="card">
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Especialidad</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Horario</th>
                                <th style={{width: '180px'}}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {therapists.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center muted">
                                        {loading ? 'Cargando...' : 'No hay terapistas cargados.'}
                                    </td>
                                </tr>
                            ) : (
                                therapists.map(t => (
                                    <tr key={t.id}>
                                        <td>{t.name}</td>
                                        <td>{t.specialty || 'General'}</td>
                                        <td>{t.email || '-'}</td>
                                        <td>{t.phone || '-'}</td>
                                        <td>{t.workingHours || '-'}</td>
                                        <td>
                                            <button 
                                                className="btn btn-sm btn-secondary" 
                                                onClick={() => handleEdit(t)}
                                                style={{marginRight: '8px'}}
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-danger" 
                                                style={{backgroundColor: '#ff4444', color: 'white'}}
                                                onClick={() => handleDelete(t.id)}
                                            >
                                                Eliminar
                                            </button>
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
                        <h3>{editingId ? 'Editar Terapeuta' : 'Nuevo Terapeuta'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{marginBottom:'10px'}}>
                                <label style={{display:'block'}}>Nombre:</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required style={{width:'100%', padding:'8px'}}/>
                            </div>
                            <div style={{marginBottom:'10px'}}>
                                <label style={{display:'block'}}>Especialidad:</label>
                                <select name="specialty" value={formData.specialty} onChange={handleInputChange} style={{width:'100%', padding:'8px'}}>
                                    <option value="Físico">Físico</option>
                                    <option value="Ocupacional">Ocupacional</option>
                                </select>
                            </div>
                            <div style={{marginBottom:'10px'}}>
                                <label style={{display:'block'}}>Email:</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Opcional" style={{width:'100%', padding:'8px'}}/>
                            </div>
                            <div style={{marginBottom:'10px'}}>
                                <label style={{display:'block'}}>Teléfono:</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} style={{width:'100%', padding:'8px'}}/>
                            </div>
                            
                            <div style={{marginBottom:'15px', padding:'15px', backgroundColor:'#f8f9fa', borderRadius:'6px', border:'1px solid #e9ecef'}}>
                                <label style={{display:'block', marginBottom:'10px', fontWeight:'600'}}>Horario de Trabajo Configurable</label>
                                
                                <div style={{display:'flex', flexWrap:'wrap', gap:'10px', marginBottom:'15px'}}>
                                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(day => (
                                        <label key={day} style={{display:'flex', alignItems:'center', cursor:'pointer', fontSize:'0.9em'}}>
                                            <input 
                                                type="checkbox" 
                                                checked={schedule.days.includes(day)}
                                                onChange={() => toggleDay(day)}
                                                style={{marginRight:'5px'}}
                                            />
                                            {day}
                                        </label>
                                    ))}
                                </div>

                                <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                                    <div style={{flex:1}}>
                                        <label style={{display:'block', fontSize:'0.85em', color:'#666', marginBottom:'4px'}}>Hora Inicio</label>
                                        <input 
                                            type="time" 
                                            value={schedule.start}
                                            onChange={(e) => updateSchedule({...schedule, start: e.target.value})}
                                            style={{width:'100%', padding:'6px', borderRadius:'4px', border:'1px solid #ccc'}} 
                                        />
                                    </div>
                                    <div style={{flex:1}}>
                                        <label style={{display:'block', fontSize:'0.85em', color:'#666', marginBottom:'4px'}}>Hora Fin</label>
                                        <input 
                                            type="time" 
                                            value={schedule.end}
                                            onChange={(e) => updateSchedule({...schedule, end: e.target.value})}
                                            style={{width:'100%', padding:'6px', borderRadius:'4px', border:'1px solid #ccc'}} 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{marginBottom:'10px'}}>
                                <label style={{display:'block'}}>Resultado (Horario):</label>
                                <input 
                                    type="text" 
                                    name="workingHours" 
                                    value={formData.workingHours} 
                                    readOnly
                                    placeholder="Selecciona días y horas arriba" 
                                    style={{width:'100%', padding:'8px', backgroundColor:'#eee', color:'#555'}}
                                />
                            </div>

                            <div style={{marginBottom:'10px'}}>
                                <label style={{display:'block'}}>
                                    Contraseña:
                                    {editingId && <small style={{fontWeight:'normal', marginLeft:'5px'}}>(Dejar en blanco para mantener actual)</small>}
                                </label>
                                <input 
                                    type="password" 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleInputChange} 
                                    required={!editingId} 
                                    style={{width:'100%', padding:'8px'}}
                                />
                            </div>
                            
                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px'}}>
                                <button type="button" onClick={() => setShowModal(false)} style={{padding: '8px 16px', cursor:'pointer'}}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" style={{padding: '8px 16px', cursor:'pointer'}}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTherapists;
