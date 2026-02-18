import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AdminPatients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // New Patient Form State
    const [formData, setFormData] = useState({
        name: '',
        cedula: '',
        email: '',
        phone: '',
        contact: '',
        type: 'regular'
    });

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await api.get('/patients');
            setPatients(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching patients:', err);
            setError('Error al cargar pacientes');
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
            // "contact" can be used for phone if phone is empty, or general contact info
            const payload = { ...formData };
            if (!payload.contact) payload.contact = payload.phone;

            const response = await api.post('/patients', payload);
            setPatients(prev => [...prev, response.data]);
            setShowModal(false);
            setFormData({ name: '', cedula: '', email: '', phone: '', contact: '' });
            toast.success('Paciente registrado exitosamente');
        } catch (err) {
            console.error('Error creating patient:', err);
            toast.error('Error al registrar paciente');
        }
    };

    // Filter Logic
    const filteredPatients = patients.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cedula.includes(searchTerm)
    );

    if (loading) return <div>Cargando pacientes...</div>;

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
                    { label: 'Pacientes Totales', value: patients.length, icon: '👥' },
                    { label: 'Nuevos (Mes)', value: '0', icon: '📈' },
                    { label: 'Activos', value: patients.length, icon: '✅' },
                    { label: 'Inactivos', value: '0', icon: '⚠️' }
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
                    { label: 'Pacientes', to: '/admin/patients', active: true, icon: '👥' },
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
            
            {error && <div className="error-message">{error}</div>}

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
                                width: '40px', height: '40px', backgroundColor: '#e3f2fd', 
                                borderRadius: '8px', color: '#1565c0', display: 'flex', 
                                alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                            }}>👥</div>
                            <div>
                                <h2 style={{margin: 0, fontSize: '20px', fontWeight: 'bold'}}>Directorio de Pacientes</h2>
                                <p style={{margin: 0, color: '#666', fontSize: '13px'}}>{patients.length} pacientes registrados</p>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        style={{
                            backgroundColor: '#111', color: 'white', border: 'none',
                            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                            fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <span>+</span> Nuevo Paciente
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{marginBottom: '24px', position: 'relative'}}>
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o cédula..." 
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
                                <th style={{padding: '16px 12px', fontWeight: '600', borderBottom: '1px solid #eee'}}>Cédula</th>
                                <th style={{padding: '16px 12px', fontWeight: '600', borderBottom: '1px solid #eee'}}>Tipo</th>
                                <th style={{padding: '16px 12px', fontWeight: '600', borderBottom: '1px solid #eee'}}>Contacto</th>
                                <th style={{padding: '16px 12px', fontWeight: '600', borderBottom: '1px solid #eee'}}>Email</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{padding: '30px', textAlign: 'center', color: '#888'}}>
                                        No hay pacientes registrados.
                                    </td>
                                </tr>
                            ) : (
                                filteredPatients.map(patient => (
                                    <tr key={patient.id} style={{fontSize: '14px', transition: 'background-color 0.2s'}}>
                                        <td style={{padding: '16px 12px', borderBottom: '1px solid #f5f5f5', fontWeight: '500'}}>{patient.name}</td>
                                        <td style={{padding: '16px 12px', borderBottom: '1px solid #f5f5f5'}}>{patient.cedula}</td>
                                        <td style={{padding: '16px 12px', borderBottom: '1px solid #f5f5f5'}}>
                                            <span style={{
                                                backgroundColor: patient.type === 'R' ? '#ffebee' : '#e3f2fd', 
                                                color: patient.type === 'R' ? '#c62828' : '#1565c0',
                                                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                                            }}>
                                                {patient.type === 'R' ? 'Tipo R' : 'Regular'}
                                            </span>
                                        </td>
                                        <td style={{padding: '16px 12px', borderBottom: '1px solid #f5f5f5'}}>{patient.phone || patient.contact || '-'}</td>
                                        <td style={{padding: '16px 12px', borderBottom: '1px solid #f5f5f5'}}>{patient.email || '-'}</td>
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
                        <h2 style={{marginTop: 0}}>Nuevo Paciente</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group" style={{marginBottom: '15px'}}>
                                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Nombre Completo</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleInputChange} 
                                    required 
                                    style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}}
                                />
                            </div>
                            <div className="form-group" style={{marginBottom: '15px'}}>
                                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Cédula</label>
                                <input 
                                    type="text" 
                                    name="cedula" 
                                    value={formData.cedula} 
                                    onChange={handleInputChange} 
                                    required 
                                    style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}}
                                />
                            </div>
                            <div className="form-group" style={{marginBottom: '15px'}}>
                                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Tipo de Paciente</label>
                                <select 
                                    name="type" 
                                    value={formData.type} 
                                    onChange={handleInputChange} 
                                    style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}}
                                >
                                    <option value="regular">Regular</option>
                                    <option value="R">R (Especial)</option>
                                </select>
                            </div>
                            <div className="form-group" style={{marginBottom: '15px'}}>
                                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Teléfono</label>
                                <input 
                                    type="text" 
                                    name="phone" 
                                    value={formData.phone} 
                                    onChange={handleInputChange} 
                                    style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}}
                                />
                            </div>
                            <div className="form-group" style={{marginBottom: '15px'}}>
                                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Email</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={formData.email} 
                                    onChange={handleInputChange} 
                                    style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}}
                                />
                            </div>
                            <div className="form-actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px'}}>
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    style={{padding: '10px 20px', border: 'none', background: '#f5f5f5', borderRadius: '8px', cursor: 'pointer'}}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    style={{padding: '10px 20px', border: 'none', background: '#111', color: 'white', borderRadius: '8px', cursor: 'pointer'}}
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPatients;
