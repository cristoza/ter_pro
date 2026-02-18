import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AdminTherapists = () => {
    const [therapists, setTherapists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
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

    // Filter therapists
    const filteredTherapists = therapists.filter(t => 
        (t.name && t.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.specialty && t.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
                    { label: 'Citas Hoy', value: '0', icon: '📅' },
                    { label: 'Esta Semana', value: '0', icon: '↗️' },
                    { label: 'Confirmadas', value: '0', icon: '✅' },
                    { label: 'Completadas', value: '0', icon: '👤' }
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
                    { label: 'Citas', to: '/admin/appointments', active: false },
                    { label: 'Pacientes', to: '/admin/patients', active: false },
                    { label: 'Terapeutas', to: '/admin/therapists', active: true, icon: '🩺' }
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
                                width: '40px', height: '40px', backgroundColor: '#e0f2f1', 
                                borderRadius: '8px', color: '#00695c', display: 'flex', 
                                alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                            }}>🩺</div>
                            <div>
                                <h2 style={{margin: 0, fontSize: '20px', fontWeight: 'bold'}}>Gestión de Terapeutas</h2>
                                <p style={{margin: 0, color: '#666', fontSize: '13px'}}>{therapists.length} terapeutas registrados</p>
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
                        <span>+</span> Nuevo Terapeuta
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{marginBottom: '24px', position: 'relative'}}>
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o especialidad..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '95%', padding: '12px 12px 12px 40px', borderRadius: '8px',
                            border: '1px solid #eee', backgroundColor: '#f8f9fa', fontSize: '14px'
                        }}
                    />
                    <span style={{position: 'absolute', left: '12px', top: '12px', color: '#999'}}>🔍</span>
                </div>

                {/* Table */}
                <div className="table-responsive">
                    <table style={{width: '100%', borderCollapse: 'separate', borderSpacing: '0'}}>
                        <thead>
                            <tr style={{textAlign: 'left', color: '#666', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                                <th style={{padding: '16px 12px', fontWeight: '600', borderBottom: '1px solid #eee'}}>Nombre</th>
                                <th style={{padding: '16px 12px', fontWeight: '600', borderBottom: '1px solid #eee'}}>Especialidad</th>
                                <th style={{padding: '16px 12px', fontWeight: '600', borderBottom: '1px solid #eee'}}>Teléfono</th>
                                <th style={{padding: '16px 12px', fontWeight: '600', borderBottom: '1px solid #eee'}}>Email</th>
                                <th style={{padding: '16px 12px', fontWeight: '600', borderBottom: '1px solid #eee'}}>Estado</th>
                                <th style={{padding: '16px 12px', fontWeight: '600', borderBottom: '1px solid #eee'}}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTherapists.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{padding: '30px', textAlign: 'center', color: '#888'}}>
                                        {loading ? 'Cargando...' : 'No se encontraron terapeutas.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredTherapists.map(t => (
                                    <tr key={t.id} style={{fontSize: '14px', transition: 'background-color 0.2s'}}>
                                        <td style={{padding: '16px 12px', borderBottom: '1px solid #f5f5f5', fontWeight: '500'}}>{t.name}</td>
                                        <td style={{padding: '16px 12px', borderBottom: '1px solid #f5f5f5'}}>{t.specialty || 'General'}</td>
                                        <td style={{padding: '16px 12px', borderBottom: '1px solid #f5f5f5'}}>{t.phone || '-'}</td>
                                        <td style={{padding: '16px 12px', borderBottom: '1px solid #f5f5f5'}}>{t.email || '-'}</td>
                                        <td style={{padding: '16px 12px', borderBottom: '1px solid #f5f5f5'}}>
                                            <span style={{
                                                backgroundColor: '#dcfce7', color: '#166534',
                                                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                                            }}>
                                                Activo
                                            </span>
                                        </td>
                                        <td style={{padding: '16px 12px', borderBottom: '1px solid #f5f5f5'}}>
                                            <div style={{display: 'flex', gap: '8px'}}>
                                                <button 
                                                    onClick={() => handleEdit(t)}
                                                    style={{border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(t.id)}
                                                    style={{border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444'}}
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
