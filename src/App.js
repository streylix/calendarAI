import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMinutes } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import CalendarHeader from './components/CalendarHeader';
import AIPromptBar from './components/AIPromptBar';
import dataService from './utils/dataService';
import aiService from './utils/aiService';

// Create a localizer for the calendar
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Custom time indicator component for showing current time with a red line
const TimeIndicator = ({ style }) => (
  <div className="rbc-current-time-indicator" style={style}>
    <div className="rbc-current-time-label">
      {format(new Date(), 'h:mm a')}
    </div>
  </div>
);

function App() {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [now, setNow] = useState(new Date());

  // Load events from storage on initial render
  useEffect(() => {
    const storedEvents = dataService.getEvents();
    setEvents(storedEvents);
  }, []);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle AI prompt submissions
  const handleAIPrompt = async (prompt) => {
    try {
      // Process the prompt using our AI service
      const eventDetails = await aiService.processPrompt(prompt);
      
      // Add the new event
      const newEvent = {
        id: Date.now().toString(),
        ...eventDetails
      };
      
      // Save to storage and update state
      const savedEvent = dataService.addEvent(newEvent);
      setEvents([...events, savedEvent]);
      
      return savedEvent;
    } catch (error) {
      console.error('Error handling AI prompt:', error);
      throw error;
    }
  };

  // Handle event selection
  const handleSelectEvent = (event) => {
    // For now, we'll just alert the event title
    // In a more complete app, this would open an event editing modal
    alert(`Selected event: ${event.title}`);
  };

  // Handle adding a new event via calendar slot selection
  const handleSelectSlot = ({ start, end }) => {
    const title = window.prompt('New Event Title:');
    if (title) {
      const newEvent = {
        id: Date.now().toString(),
        title,
        start,
        end
      };
      
      // Save to storage and update state
      const savedEvent = dataService.addEvent(newEvent);
      setEvents([...events, savedEvent]);
    }
  };

  return (
    <div className="app-container">
      <CalendarHeader 
        view={view}
        date={date}
        onViewChange={setView}
        onDateChange={setDate}
      />
      
      <div className="calendar-container">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          view={view}
          date={date}
          onView={setView}
          onNavigate={setDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          now={now}
          components={{
            timeGutterHeader: () => (
              <div className="rbc-time-header-gutter-current">
                {format(now, 'h:mm a')}
              </div>
            ),
            currentTimeIndicator: TimeIndicator
          }}
        />
      </div>
      
      <AIPromptBar onSubmit={handleAIPrompt} />
    </div>
  );
}

export default App; 