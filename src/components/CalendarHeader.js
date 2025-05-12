import React from 'react';
import { format } from 'date-fns';

function CalendarHeader({ view, date, onViewChange, onDateChange }) {
  // Handle navigation
  const handlePrev = () => {
    const newDate = new Date(date);
    switch (view) {
      case 'month':
        newDate.setMonth(date.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(date.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(date.getDate() - 1);
        break;
      default:
        break;
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(date);
    switch (view) {
      case 'month':
        newDate.setMonth(date.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(date.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(date.getDate() + 1);
        break;
      default:
        break;
    }
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  // Format the current date/range for display
  const getHeaderText = () => {
    switch (view) {
      case 'month':
        return format(date, 'MMMM yyyy');
      case 'week':
        return `Week of ${format(date, 'MMM d, yyyy')}`;
      case 'day':
        return format(date, 'EEEE, MMMM d, yyyy');
      default:
        return '';
    }
  };

  return (
    <div className="calendar-header">
      <div className="header-title">
        <h1>AI Calendar</h1>
      </div>
      
      <div className="header-controls">
        <div className="view-controls">
          <button 
            className={view === 'month' ? 'active' : ''} 
            onClick={() => onViewChange('month')}
          >
            Month
          </button>
          <button 
            className={view === 'week' ? 'active' : ''} 
            onClick={() => onViewChange('week')}
          >
            Week
          </button>
          <button 
            className={view === 'day' ? 'active' : ''} 
            onClick={() => onViewChange('day')}
          >
            Day
          </button>
        </div>
        
        <div className="navigation-controls">
          <button onClick={handlePrev}>&lt;</button>
          <button onClick={handleToday}>Today</button>
          <button onClick={handleNext}>&gt;</button>
          <span className="current-date">{getHeaderText()}</span>
        </div>
      </div>
    </div>
  );
}

export default CalendarHeader; 