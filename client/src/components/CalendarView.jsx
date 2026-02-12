import { useState, useMemo } from 'react';

const CalendarView = ({ appointments, onSlotClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Helper to get start of week (Monday)
    const getStartOfWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const startOfWeek = useMemo(() => getStartOfWeek(new Date(currentDate)), [currentDate]);
    
    // Generate week days
    const weekDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < 6; i++) { // Mon-Sat
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            days.push(d);
        }
        return days;
    }, [startOfWeek]);

    // Generate time slots (8:00 to 18:00)
    const timeSlots = [];
    for (let h = 8; h < 18; h++) {
        timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    const nextWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 7);
        setCurrentDate(d);
    };

    const prevWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 7);
        setCurrentDate(d);
    };

    // Helper for robust local date strings
    const toSortableDate = (d) => {
        if (!d) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Filter appointments for this week
    const weekAppointments = useMemo(() => {
        if (!Array.isArray(appointments)) return [];
        
        const startStr = toSortableDate(startOfWeek);
        const endDay = new Date(startOfWeek);
        endDay.setDate(endDay.getDate() + 5); // Saturday
        const endStr = toSortableDate(endDay);


        const filtered = appointments.filter(appt => {
            if (!appt || !appt.date) return false;
            
            let dateStr = '';
            if (typeof appt.date === 'string') {
                if (appt.date.includes('T')) {
                    dateStr = appt.date.split('T')[0];
                } else {
                    dateStr = appt.date;
                }
            } else if (appt.date instanceof Date) {
                dateStr = toSortableDate(appt.date);
            }
            
            const match = dateStr >= startStr && dateStr <= endStr;
            return match;
        });

        return filtered;
    }, [appointments, startOfWeek]);

    const getApptStyle = (appt) => {
        // Calculate top position based on time
        if (!appt.time) return {};
        const [h, m] = appt.time.split(':').map(Number);
        const startMin = (h - 8) * 60 + m; // minutes from 8:00
        const top = (startMin / 30) * 50; // 50px per 30 mins
        
        // Calculate height
        const height = ((appt.durationMinutes || 30) / 30) * 50;
        
        let bgColor = '#4299e1'; // Blue default
        if (appt.machineId) bgColor = '#ed8936'; // Orange if machine assigned
        if (appt.status === 'completed') bgColor = '#48bb78';
        if (appt.status === 'cancelled') bgColor = '#f56565';

        return {
            top: `${top}px`,
            height: `${height - 2}px`, // -2 for margin
            backgroundColor: bgColor
        };
    };

    return (
        <div className="calendar-view">
            {/* Header Controls */}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                <button onClick={prevWeek} className="btn btn-secondary">← Anterior</button>
                <h3 style={{margin: 0}}>
                    {startOfWeek.toLocaleDateString()} - {weekDays[weekDays.length-1].toLocaleDateString()}
                </h3>
                <button onClick={nextWeek} className="btn btn-secondary">Siguiente →</button>
            </div>

            {/* Calendar Grid */}
            <div style={{display: 'flex', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'white'}}>
                {/* Time Axis */}
                <div style={{width: '60px', borderRight: '1px solid #eee', flexShrink: 0}}>
                    <div style={{height: '40px', borderBottom: '1px solid #eee'}}></div> {/* Header spacer */}
                    {timeSlots.map(time => (
                        <div key={time} style={{height: '50px', borderBottom: '1px solid #eee', textAlign: 'right', paddingRight: '8px', fontSize: '0.8em', color: '#666', boxSizing: 'border-box', paddingTop: '4px'}}>
                            {time}
                        </div>
                    ))}
                </div>

                {/* Days Columns */}
                {weekDays.map(day => {
                    const dayStr = toSortableDate(day);

                    const dayAppts = weekAppointments.filter(a => {
                        if (!a.date) return false;
                        let aDate = '';
                        if (typeof a.date === 'string') {
                            if (a.date.includes('T')) aDate = a.date.split('T')[0];
                            else aDate = a.date;
                        } else if (a.date instanceof Date) {
                             aDate = toSortableDate(a.date);
                        }
                        return aDate === dayStr;
                    });

                    return (
                        <div key={dayStr} style={{flex: 1, borderRight: '1px solid #eee', minWidth: '120px', position: 'relative'}}>
                            {/* Day Header */}
                            <div style={{height: '40px', borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa'}}>
                                {day.toLocaleDateString(undefined, {weekday: 'short', day: 'numeric'})}
                            </div>
                            
                            {/* Slots Container */}
                            <div style={{position: 'relative', height: `${timeSlots.length * 50}px`}}>
                                {/* Grid Lines */}
                                {timeSlots.map(time => (
                                    <div key={time} style={{height: '50px', borderBottom: '1px solid #f5f5f5', boxSizing: 'border-box'}}></div>
                                ))}

                                {/* Appointment Blocks */}
                                {dayAppts.map(appt => (
                                    <div 
                                        key={appt.id}
                                        className="appt-block"
                                        onClick={() => onSlotClick && onSlotClick(appt)}
                                        style={{
                                            position: 'absolute',
                                            left: '4px',
                                            right: '4px',
                                            borderRadius: '4px',
                                            padding: '4px',
                                            color: 'white',
                                            fontSize: '0.75em',
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            zIndex: 10,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                            ...getApptStyle(appt)
                                        }}
                                        title={`${appt.time} - ${appt.patientName} (${appt.therapist?.name})`}
                                    >
                                        <div style={{fontWeight: 'bold'}}>{appt.patientName}</div>
                                        <div>{appt.therapist?.name}</div>
                                        {appt.machineId && <div style={{fontSize: '0.9em', opacity: 0.9}}>⚙️ Equipo Asignado</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
             <div style={{marginTop: '12px', display: 'flex', gap: '16px', fontSize: '0.9em'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}><div style={{width: 12, height: 12, background: '#4299e1', borderRadius: 2}}></div> Estándar</div>
                <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}><div style={{width: 12, height: 12, background: '#ed8936', borderRadius: 2}}></div> Con Equipo</div>
                <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}><div style={{width: 12, height: 12, background: '#48bb78', borderRadius: 2}}></div> Completada</div>
            </div>
        </div>
    );
};

export default CalendarView;
