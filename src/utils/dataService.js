// Data service for handling events in our calendar app

// This is a simple implementation using localStorage
// In a production app, this would connect to the main process via the electron bridge

// Helper to serialize/deserialize dates
const serializeEvent = (event) => {
  return {
    ...event,
    start: event.start.toISOString(),
    end: event.end.toISOString(),
  };
};

const deserializeEvent = (event) => {
  return {
    ...event,
    start: new Date(event.start),
    end: new Date(event.end),
  };
};

// Save all events to localStorage
const saveEvents = (events) => {
  const serializedEvents = events.map(serializeEvent);
  localStorage.setItem('calendar_events', JSON.stringify(serializedEvents));
};

// Get all events from localStorage
const getEvents = () => {
  const eventsJSON = localStorage.getItem('calendar_events');
  if (!eventsJSON) return [];
  
  try {
    const events = JSON.parse(eventsJSON);
    return events.map(deserializeEvent);
  } catch (error) {
    console.error('Error parsing events from storage:', error);
    return [];
  }
};

// Add a new event
const addEvent = (event) => {
  const events = getEvents();
  const newEvent = {
    ...event,
    id: event.id || Date.now().toString(), // Ensure event has an ID
  };
  
  events.push(newEvent);
  saveEvents(events);
  return newEvent;
};

// Update an existing event
const updateEvent = (updatedEvent) => {
  const events = getEvents();
  const index = events.findIndex(e => e.id === updatedEvent.id);
  
  if (index === -1) {
    console.error('Event not found for update:', updatedEvent.id);
    return null;
  }
  
  events[index] = updatedEvent;
  saveEvents(events);
  return updatedEvent;
};

// Delete an event
const deleteEvent = (eventId) => {
  const events = getEvents();
  const filteredEvents = events.filter(e => e.id !== eventId);
  
  if (filteredEvents.length === events.length) {
    console.error('Event not found for deletion:', eventId);
    return false;
  }
  
  saveEvents(filteredEvents);
  return true;
};

export default {
  getEvents,
  addEvent,
  updateEvent,
  deleteEvent,
}; 