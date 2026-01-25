/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useMemo } from 'react';

const CLOCK_RADIUS = 125;
const NUMBER_RADIUS = 105;

export default function TimePicker({ initialTime, onSelect, onClose }) {
    const [view, setView] = useState('hour'); // 'hour' or 'minute'
    const [hour, setHour] = useState(initialTime.hour);
    const [minute, setMinute] = useState(initialTime.minute);
    const [period, setPeriod] = useState(initialTime.period);

    useEffect(() => {
        // Reset state if initialTime prop changes
        setHour(initialTime.hour);
        setMinute(initialTime.minute);
        setPeriod(initialTime.period);
        setView('hour');
    }, [initialTime]);

    const handleSelectHour = (selectedHour) => {
        setHour(String(selectedHour).padStart(2, '0'));
        setView('minute');
    };

    const handleSelectMinute = (selectedMinute) => {
        setMinute(String(selectedMinute).padStart(2, '0'));
    };

    const handleOk = () => {
        onSelect({ hour, minute, period });
    };

    const handRotation = useMemo(() => {
        if (view === 'hour') {
            const angle = (parseInt(hour, 10) % 12) * 30;
            return angle;
        } else {
            const angle = parseInt(minute, 10) * 6;
            return angle;
        }
    }, [view, hour, minute]);
    
    const clockNumbers = useMemo(() => {
        const numbers = [];
        const numCount = view === 'hour' ? 12 : 12; // 12 numbers for both views (00, 05, etc. for minutes)
        const angleStep = 360 / numCount;

        for (let i = 1; i <= numCount; i++) {
            const angle = (i * angleStep - 90) * (Math.PI / 180);
            const value = view === 'hour' ? i : (i-1) * 5;
            numbers.push({
                value: String(value).padStart(2, '0'),
                style: {
                    transform: `translate(${NUMBER_RADIUS * Math.cos(angle)}px, ${NUMBER_RADIUS * Math.sin(angle)}px)`
                }
            });
        }
        return numbers;
    }, [view]);

    return (
        <div className="time-picker-overlay" onClick={onClose}>
            <div className="time-picker-container" onClick={(e) => e.stopPropagation()}>
                <div className="time-picker-header">Select Time</div>
                <div className="time-picker-display">
                    <div
                        className={`time-display-box ${view === 'hour' ? 'active' : ''}`}
                        onClick={() => setView('hour')}
                    >
                        {hour}
                    </div>
                    <div className="time-display-separator">:</div>
                    <div
                        className={`time-display-box ${view === 'minute' ? 'active' : ''}`}
                        onClick={() => setView('minute')}
                    >
                        {minute}
                    </div>
                    <div className="time-picker-period">
                        <button
                            className={`period-btn ${period === 'AM' ? 'active' : ''}`}
                            onClick={() => setPeriod('AM')}
                        >
                            AM
                        </button>
                        <button
                            className={`period-btn ${period === 'PM' ? 'active' : ''}`}
                            onClick={() => setPeriod('PM')}
                        >
                            PM
                        </button>
                    </div>
                </div>

                <div className="time-picker-clock">
                    <div className="clock-center"></div>
                    <div className="clock-hand" style={{ transform: `rotate(${handRotation}deg)` }}></div>
                     {clockNumbers.map(({ value, style }) => {
                        const isSelected = view === 'hour' ? parseInt(value, 10) === parseInt(hour, 10) : parseInt(value, 10) === parseInt(minute, 10);
                        return (
                            <div
                                key={value}
                                className={`clock-number ${isSelected ? 'selected' : ''}`}
                                style={{
                                    top: `calc(50% - 20px)`,
                                    left: `calc(50% - 20px)`,
                                    ...style
                                }}
                                onClick={() => view === 'hour' ? handleSelectHour(value) : handleSelectMinute(value)}
                            >
                                {view === 'hour' ? parseInt(value, 10) : value}
                            </div>
                        );
                    })}
                </div>

                <div className="time-picker-actions">
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={handleOk}>OK</button>
                </div>
            </div>
        </div>
    );
}