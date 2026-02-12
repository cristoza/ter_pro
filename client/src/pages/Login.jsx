import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const response = await api.post('/api/login', formData);
            
            if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate('/dashboard');
            } else {
                setError('Credenciales inválidas');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.error || 'Error al iniciar sesión. Verifique sus credenciales.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-split">
            {/* Left Side */}
            <div className="brand-side">
                <div className="brand-content">
                    <div className="brand-icon">🏥</div>
                    <h1 className="brand-title">Hospital del Adulto Mayor</h1>
                    <p className="brand-text">Sistema de gestión de citas</p>
                </div>
            </div>

            {/* Right Side */}
            <div className="form-side">
                <div className="login-card">
                    <div className="login-header">
                        <h2>Bienvenido de nuevo</h2>
                        <p>Ingresa tus credenciales para acceder al sistema</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username">Usuario</label>
                            <div className="input-wrapper">
                                <span className="input-icon">👤</span>
                                <input 
                                    type="text" 
                                    id="username" 
                                    name="username" 
                                    placeholder="Ej. admin"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required 
                                    autoFocus
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Contraseña</label>
                            <div className="input-wrapper">
                                <span className="input-icon">🔒</span>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    id="password" 
                                    name="password" 
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '1.2em',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#64748b',
                                        zIndex: 5
                                    }}
                                    title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-login" disabled={loading}>
                            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    <div className="footer">
                        <p>© {new Date().getFullYear()} Hospital del Adulto Mayor</p>
                        <p>Sistema de gestión de citas</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
