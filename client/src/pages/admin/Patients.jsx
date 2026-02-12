import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AdminPatients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    
    // New Patient Form State
    const [formData, setFormData] = useState({
        name: '',
        cedula: '',
        email: '',
        phone: '',
        contact: ''
        // birthDate handling omitted for brevity
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

    if (loading) return <div>Cargando pacientes...</div>;

    return (
        <div className="admin-view">
            <div className="page-header">
                <h1>Pacientes</h1>
                <p>Directorio de pacientes registrados</p>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + Nuevo Paciente
                </button>
            </div>
            
            {error && <div className="error-message">{error}</div>}

            <div className="card">
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Cédula</th>
                                <th>Contacto</th>
                                <th>Email</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center muted">No hay pacientes registrados.</td>
                                </tr>
                            ) : (
                                patients.map(patient => (
                                    <tr key={patient.id}>
                                        <td>{patient.name}</td>
                                        <td>{patient.cedula}</td>
                                        <td>{patient.phone || patient.contact}</td>
                                        <td>{patient.email || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Patient Modal */}
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
                        <h3>Nuevo Paciente</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{marginBottom: '10px'}}>
                                <label style={{display:'block'}}>Nombre Completo:</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required style={{width:'100%', padding:'8px'}}/>
                            </div>
                            <div style={{marginBottom: '10px'}}>
                                <label style={{display:'block'}}>Cédula:</label>
                                <input type="text" name="cedula" value={formData.cedula} onChange={handleInputChange} required style={{width:'100%', padding:'8px'}}/>
                            </div>
                            <div style={{marginBottom: '10px'}}>
                                <label style={{display:'block'}}>Teléfono:</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} style={{width:'100%', padding:'8px'}}/>
                            </div>
                            <div style={{marginBottom: '10px'}}>
                                <label style={{display:'block'}}>Email (Opcional):</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} style={{width:'100%', padding:'8px'}}/>
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

export default AdminPatients;
