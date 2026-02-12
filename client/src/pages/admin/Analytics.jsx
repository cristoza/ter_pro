import { useState, useEffect } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const commonTheme = {
        axis: {
            domain: { line: { stroke: '#777777', strokeWidth: 1 } },
            legend: { text: { fontSize: 13, fill: '#333333', fontWeight: 'bold' } },
            ticks: {
                line: { stroke: '#777777', strokeWidth: 1 },
                text: { fontSize: 12, fill: '#333333' }
            }
        },
        grid: { line: { stroke: '#dddddd', strokeWidth: 1 } },
        legends: { text: { fontSize: 12, fill: '#333333' } },
        tooltip: {
            container: {
                background: '#ffffff',
                color: '#333333',
                fontSize: 12,
                borderRadius: '4px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
                padding: '5px 9px'
            }
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = {};
            if (dateRange.start) params.startDate = dateRange.start;
            if (dateRange.end) params.endDate = dateRange.end;

            const res = await api.get('/api/analytics', { params });
            setData(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Analytics Error:', error);
            toast.error('Error cargando analíticas');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    // Data Transformers
    const getPieData = () => {
        if (!data?.appointmentsByStatus) return [];
        return data.appointmentsByStatus.map(item => ({
            id: item.status || 'Desconocido',
            label: translateStatus(item.status),
            value: parseInt(item.count),
            color: getStatusColor(item.status)
        }));
    };

    const getLineData = () => {
        if (!data?.appointmentsOverTime) return [];
        return [{
            id: 'Citas',
            color: 'hsl(142, 70%, 50%)',
            data: data.appointmentsOverTime.map(item => ({
                x: item.date.substring(5), // Show only MM-DD
                y: parseInt(item.count)
            }))
        }];
    };

    const getBarData = () => {
        if (!data?.appointmentsByTherapist) return [];
        return data.appointmentsByTherapist.map(item => ({
            therapist: item.therapist?.name?.split(' ')[0] || 'Unknown', // First name only
            citas: parseInt(item.count)
        }));
    };

    const translateStatus = (s) => {
        const map = {
            'scheduled': 'Programada',
            'completed': 'Completada',
            'cancelled': 'Cancelada',
            'no_show': 'No Asistió'
        };
        return map[s] || s;
    };

    const getStatusColor = (s) => {
        const map = {
            'scheduled': '#3b82f6', // blue
            'completed': '#22c55e', // green
            'cancelled': '#ef4444', // red
            'no_show': '#f59e0b'    // orange
        };
        return map[s] || '#94a3b8';
    };

    if (loading) return <div className="p-4 text-center">Cargando gráficos...</div>;

    return (
        <div className="admin-view" style={{paddingBottom: '50px'}}>
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <h1>Analíticas y Reportes</h1>
                <p>Visualización del rendimiento del hospital</p>
                
                <div style={{ marginTop: '15px', display: 'flex', gap: '15px', alignItems: 'center', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <label style={{fontWeight:'bold'}}>Rango:</label>
                    <input 
                        type="date" 
                        value={dateRange.start} 
                        onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))}
                        style={{padding:'5px', border:'1px solid #ccc', borderRadius:'4px'}}
                    />
                    <span>a</span>
                    <input 
                        type="date" 
                        value={dateRange.end} 
                        onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))}
                        style={{padding:'5px', border:'1px solid #ccc', borderRadius:'4px'}}
                    />
                    <button className="btn btn-secondary" onClick={() => setDateRange({start:'', end:''})}>
                        Limpiar
                    </button>
                    {(dateRange.start || dateRange.end) && <span style={{fontSize:'0.9em', color:'#666', marginLeft:'auto'}}>Filtrando resultados</span>}
                </div>
            </div>
            
            <div className="dashboard-grid">
                <div className="stat">
                    <div className="stat-value">{data?.totalAppointments || 0}</div>
                    <div className="stat-label">Citas Totales (Periodo)</div>
                </div>
                <div className="stat">
                    <div className="stat-value">{data?.totalPatients || 0}</div>
                    <div className="stat-label">Pacientes Activos</div>
                </div>
                <div className="stat">
                    <div className="stat-value">{data?.totalTherapists || 0}</div>
                    <div className="stat-label">Terapistas</div>
                </div>
            </div>

            <div className="charts-grid">
                {/* STATUS CHART */}
                <div className="card" style={{ height: '400px' }}>
                    <h3 style={{ marginBottom: '10px' }}>Estado de Citas</h3>
                    <div style={{ height: '320px' }}>
                        {getPieData().length > 0 ? (
                            <ResponsivePie
                                data={getPieData()}
                                theme={commonTheme}
                                margin={{ top: 20, right: 140, bottom: 20, left: 20 }}
                                innerRadius={0.6}
                                padAngle={0.7}
                                cornerRadius={3}
                                activeOuterRadiusOffset={8}
                                colors={{ datum: 'data.color' }}
                                borderWidth={1}
                                borderColor={{ from: 'color', modifiers: [ [ 'darker', 0.2 ] ] }}
                                arcLinkLabelsSkipAngle={10}
                                arcLinkLabelsTextColor="#333333"
                                arcLinkLabelsThickness={2}
                                arcLinkLabelsColor={{ from: 'color' }}
                                arcLabelsSkipAngle={10}
                                arcLabelsTextColor={{ from: 'color', modifiers: [ [ 'darker', 2 ] ] }}
                                legends={[
                                    {
                                        anchor: 'right',
                                        direction: 'column',
                                        justify: false,
                                        translateX: 120,
                                        translateY: 0,
                                        itemsSpacing: 10,
                                        itemWidth: 100,
                                        itemHeight: 18,
                                        itemTextColor: '#999',
                                        itemDirection: 'left-to-right',
                                        itemOpacity: 1,
                                        symbolSize: 18,
                                        symbolShape: 'circle'
                                    }
                                ]}
                            />
                        ) : (
                            <p className="text-center muted" style={{marginTop:'100px'}}>No hay datos suficientes</p>
                        )}
                    </div>
                </div>

                {/* TIMELINE CHART */}
                <div className="card" style={{ height: '400px' }}>
                    <h3 style={{ marginBottom: '10px' }}>Evolución de Citas (Por Día)</h3>
                    <div style={{ height: '320px' }}>
                        {getLineData().length > 0 && getLineData()[0].data.length > 0 ? (
                            <ResponsiveLine
                                data={getLineData()}
                                theme={commonTheme}
                                margin={{ top: 20, right: 30, bottom: 60, left: 50 }}
                                xScale={{ type: 'point' }}
                                yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: true, reverse: false }}
                                yFormat=" >-.0f"
                                axisTop={null}
                                axisRight={null}
                                axisBottom={{
                                    orient: 'bottom',
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: -45, // Rotated for better readability
                                    legend: 'Fecha',
                                    legendOffset: 50,
                                    legendPosition: 'middle'
                                }}
                                axisLeft={{
                                    orient: 'left',
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 0,
                                    legend: 'Cantidad',
                                    legendOffset: -40,
                                    legendPosition: 'middle',
                                    format: e => Math.floor(e) === e ? e : "" // Integers only
                                }}
                                gridYValues={5} // Limit horizontal grid lines
                                pointSize={10}
                                pointColor={{ theme: 'background' }}
                                pointBorderWidth={2}
                                pointBorderColor={{ from: 'serieColor' }}
                                pointLabelYOffset={-12}
                                useMesh={true}
                                colors={{ scheme: 'category10' }}
                            />
                        ) : (
                             <p className="text-center muted" style={{marginTop:'100px'}}>No hay datos suficientes</p>
                        )}
                    </div>
                </div>

                {/* THERAPIST CHART */}
                <div className="card chart-full-width" style={{ height: '400px' }}>
                    <h3 style={{ marginBottom: '10px' }}>Rendimiento por Terapista</h3>
                    <div style={{ height: '320px' }}>
                        {getBarData().length > 0 ? (
                            <ResponsiveBar
                                data={getBarData()}
                                theme={commonTheme}
                                keys={['citas']}
                                indexBy="therapist"
                                margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
                                padding={0.3}
                                valueScale={{ type: 'linear' }}
                                indexScale={{ type: 'band', round: true }}
                                colors={{ scheme: 'nivo' }}
                                borderColor={{ from: 'color', modifiers: [ [ 'darker', 1.6 ] ] }}
                                axisTop={null}
                                axisRight={null}
                                axisBottom={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 0,
                                    legend: 'Terapista',
                                    legendPosition: 'middle',
                                    legendOffset: 40
                                }}
                                axisLeft={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 0,
                                    legend: 'Citas Atendidas',
                                    legendPosition: 'middle',
                                    legendOffset: -40,
                                    format: e => Math.floor(e) === e ? e : "" // Integers only
                                }}
                                labelSkipWidth={12}
                                labelSkipHeight={12}
                                labelTextColor={{ from: 'color', modifiers: [ [ 'darker', 1.6 ] ] }}
                            />
                        ) : (
                             <p className="text-center muted" style={{marginTop:'100px'}}>No hay datos suficientes</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
