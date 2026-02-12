import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AdminMachines = () => {
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'occupancy'
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // Occupancy State
    const [occupancyData, setOccupancyData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [formData, setFormData] = useState({
        name: '',
        type: 'General',
        status: 'active',
        sessionDuration: 30
    });

    useEffect(() => {
        if (activeTab === 'list') {
            fetchMachines();
        } else {
            fetchOccupancy();
        }
    }, [activeTab, selectedDate]);

    const fetchMachines = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/machines');
            setMachines(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching machines:', error);
            const msg = error.response?.data?.message || 'Error cargando equipos';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const fetchOccupancy = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/machines/occupancy?date=${selectedDate}`);
            setOccupancyData(response.data);
        } catch (error) {
            console.error('Error fetching occupancy:', error);
            toast.error('Error cargando ocupación');
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
            const payload = {
                ...formData,
                sessionDuration: parseInt(formData.sessionDuration)
            };

            if (editingId) {
                // Optimistic Update
                setMachines(prev => prev.map(m => 
                    m.id === editingId ? { ...m, ...payload, id: editingId } : m
                ));
                await api.put(`/api/machines/${editingId}`, payload);
                toast.success('Equipo actualizado');
            } else {
                const response = await api.post('/api/machines', payload);
                setMachines(prev => [...prev, response.data]);
                toast.success('Equipo creado');
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({ name: '', type: 'General', status: 'active', sessionDuration: 30 });
        } catch (error) {
            console.error('Error saving machine:', error);
            let detailedMsg = error.response?.data?.message || 'Error al guardar';
            toast.error(detailedMsg);
            if (editingId) fetchMachines(); 
        }
    };

    const handleEdit = (machine) => {
        setEditingId(machine.id);
        setFormData({
            name: machine.name,
            type: machine.type,
            status: machine.status,
            sessionDuration: machine.sessionDuration || 30
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este equipo?')) return;
        try {
            await api.delete(`/api/machines/${id}`);
            fetchMachines();
        } catch (error) {
            console.error('Error deleting machine:', error);
        }
    };
    
    const openNewModal = () => {
        setEditingId(null);
        setFormData({ name: '', type: 'General', status: 'active', sessionDuration: 30 });
        setShowModal(true);
    };

    return (
        <div className="admin-view">
            <div className="page-header" style={{marginBottom: '20px'}}>
                <h1>Gestión de Equipos y Recursos</h1>
                <p>Configura los cubículos y máquinas disponibles para la asignación automática</p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                    <button 
                        className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('list')}
                        style={activeTab !== 'list' ? {background:'#e2e8f0', color:'#334155'} : {}}
                    >
                        Listado de Equipos
                    </button>
                    <button 
                        className={`btn ${activeTab === 'occupancy' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('occupancy')}
                        style={activeTab !== 'occupancy' ? {background:'#e2e8f0', color:'#334155'} : {}}
                    >
                        Ver Ocupación
                    </button>
                    
                    {activeTab === 'list' && (
                        <button className="btn btn-primary" onClick={openNewModal} style={{marginLeft: 'auto'}}>
                            + Nuevo Equipo
                        </button>
                    )}
                </div>
            </div>
            
            {activeTab === 'list' ? (
                <div className="card">
                    {loading ? <p>Cargando...</p> : (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Tipo</th>
                                        <th>Duración (min)</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {machines.length === 0 ? (
                                        <tr><td colSpan="6">No hay equipos registrados.</td></tr>
                                    ) : (
                                        machines.map(m => (
                                            <tr key={m.id}>
                                                <td>{m.id}</td>
                                                <td><strong>{m.name}</strong></td>
                                                <td><span className="badge">{m.type}</span></td>
                                                <td>{m.sessionDuration || 30}</td>
                                                <td>
                                                    <span style={{
                                                        color: m.status === 'active' ? 'green' : 'red',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {m.status === 'active' ? 'Activo' : 'Mantenimiento'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button 
                                                        className="btn btn-small"
                                                        style={{backgroundColor: '#2196F3', color: 'white', marginRight: '8px'}}
                                                        onClick={() => handleEdit(m)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button 
                                                        className="btn btn-small"
                                                        style={{backgroundColor: '#ff4444', color: 'white'}}
                                                        onClick={() => handleDelete(m.id)}
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
                    )}
                </div>
            ) : (
                <div className="card">
                     <div style={{marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px'}}>
                        <label style={{fontWeight:'bold'}}>Fecha a consultar:</label>
                        <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{padding:'8px', borderRadius:'6px', border:'1px solid #ccc'}}
                        />
                    </div>

                    {loading ? <p>Cargando disponibilidad...</p> : (
                        <div className="table-responsive">
                             <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{width:'25%'}}>Equipo</th>
                                        <th>Cronograma de Uso ({selectedDate})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {occupancyData.map(m => (
                                        <tr key={m.id}>
                                            <td style={{verticalAlign:'top', borderRight:'1px solid #eee'}}>
                                                <div style={{fontWeight:'bold', fontSize:'1.1em'}}>{m.name}</div>
                                                <div style={{color:'#666', marginBottom:'5px'}}>{m.type}</div>
                                                <div style={{
                                                    display:'inline-block',
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    fontSize: '0.75em',
                                                    backgroundColor: m.status === 'active' ? '#dcfce7' : '#fee2e2',
                                                    color: m.status === 'active' ? '#166534' : '#991b1b'
                                                }}>
                                                    {m.status === 'active' ? 'Disponible' : 'Fuera de Servicio'}
                                                </div>
                                            </td>
                                            <td>
                                                {(!m.appointments || m.appointments.length === 0) ? (
                                                    <div style={{padding:'20px', color:'#94a3b8', textAlign:'center', border:'1px dashed #cbd5e1', borderRadius:'8px'}}>
                                                        Sin reservas para este día
                                                    </div>
                                                ) : (
                                                    <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                                                        {m.appointments.map(apt => (
                                                            <div key={apt.id} style={{
                                                                display:'flex', 
                                                                alignItems:'center',
                                                                backgroundColor: '#f8fafc',
                                                                border: '1px solid #e2e8f0',
                                                                padding: '10px',
                                                                borderRadius: '6px',
                                                                borderLeft: '4px solid #3b82f6'
                                                            }}>
                                                                <div style={{
                                                                    backgroundColor:'#dbeafe', color:'#1e40af', 
                                                                    padding:'4px 8px', borderRadius:'4px', fontWeight:'bold', marginRight:'12px'
                                                                }}>
                                                                    {apt.time.substring(0,5)}
                                                                </div>
                                                                <div style={{flex:1}}>
                                                                    <div style={{fontWeight:'600'}}>{apt.patient ? apt.patient.name : apt.patientName}</div>
                                                                    <div style={{fontSize:'0.85em', color:'#64748b'}}>
                                                                        Terapista: {apt.therapist ? apt.therapist.name : 'No asignado'}
                                                                    </div>
                                                                </div>
                                                                <div style={{color:'#64748b', fontSize:'0.9em'}}>
                                                                    ⏱️ {apt.durationMinutes} min
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            
            {showModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{backgroundColor: 'white', padding: '24px', borderRadius: '8px', minWidth: '400px'}}>
                        <h3>{editingId ? 'Editar Equipo' : 'Nuevo Equipo'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{marginBottom: '12px'}}>
                                <label style={{display: 'block'}}>Nombre</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleInputChange}
                                    style={{width: '100%', padding: '8px'}}
                                    required 
                                />
                            </div>
                            <div style={{marginBottom: '12px'}}>
                                <label style={{display: 'block'}}>Tipo</label>
                                <select 
                                    name="type" 
                                    value={formData.type} 
                                    onChange={handleInputChange}
                                    style={{width: '100%', padding: '8px'}}
                                >
                                    <option value="General">Cubículo Estándar</option>
                                    <option value="Gym">Gimnasio</option>
                                    <option value="Laser">Láser</option>
                                    <option value="Magneto">Magneto</option>
                                    <option value="Ultrasound">Ultrasonido</option>
                                    <option value="Comun">Área Común</option>
                                </select>
                            </div>
                            <div style={{marginBottom: '12px'}}>
                                <label style={{display: 'block'}}>Duración Sesión (min)</label>
                                <select
                                    name="sessionDuration"
                                    value={formData.sessionDuration}
                                    onChange={handleInputChange}
                                    style={{width: '100%', padding: '8px'}}
                                >
                                    <option value="15">15 min</option>
                                    <option value="30">30 min</option>
                                    <option value="45">45 min</option>
                                    <option value="60">60 min</option>
                                </select>
                            </div>
                            <div style={{marginBottom: '20px'}}>
                                <label style={{display: 'block'}}>Estado</label>
                                <select 
                                    name="status" 
                                    value={formData.status} 
                                    onChange={handleInputChange}
                                    style={{width: '100%', padding: '8px'}}
                                >
                                    <option value="active">Activo</option>
                                    <option value="maintenance">En Mantenimiento</option>
                                </select>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px'}}>
                                <button type="button" onClick={() => setShowModal(false)} style={{padding: '8px 16px'}}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" style={{padding: '8px 16px'}}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMachines;
