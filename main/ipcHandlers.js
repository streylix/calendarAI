const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Path for storing calendar events
const dataPath = path.join(app.getPath('userData'), 'data');
const eventsFilePath = path.join(dataPath, 'events.json');

// Ensure data directory exists
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// Helper functions for reading/writing events
const readEvents = () => {
  if (!fs.existsSync(eventsFilePath)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(eventsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading events file:', error);
    return [];
  }
};

const writeEvents = (events) => {
  try {
    fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing events file:', error);
    return false;
  }
};

// Setup IPC handlers
const setupIpcHandlers = () => {
  // Get all events
  ipcMain.handle('getEvents', async () => {
    return readEvents();
  });

  // Save a new event
  ipcMain.handle('saveEvent', async (_, event) => {
    const events = readEvents();
    const newEvent = {
      ...event,
      id: event.id || Date.now().toString(),
    };
    
    events.push(newEvent);
    const success = writeEvents(events);
    
    return success ? newEvent : null;
  });

  // Update an existing event
  ipcMain.handle('updateEvent', async (_, updatedEvent) => {
    const events = readEvents();
    const index = events.findIndex(e => e.id === updatedEvent.id);
    
    if (index === -1) {
      return null;
    }
    
    events[index] = updatedEvent;
    const success = writeEvents(events);
    
    return success ? updatedEvent : null;
  });

  // Delete an event
  ipcMain.handle('deleteEvent', async (_, eventId) => {
    const events = readEvents();
    const filteredEvents = events.filter(e => e.id !== eventId);
    
    if (filteredEvents.length === events.length) {
      return false;
    }
    
    const success = writeEvents(filteredEvents);
    return success;
  });

  // Process AI prompt
  // In a full implementation, this would connect to OpenAI or another AI service
  ipcMain.handle('processAIPrompt', async (_, prompt) => {
    console.log('Processing AI prompt in main process:', prompt);
    
    // This is a stub - in a real app, we'd process the prompt with OpenAI here
    // For now, return a mock response
    return {
      title: `AI Event: ${prompt}`,
      start: new Date().toISOString(),
      end: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
    };
  });
};

module.exports = { setupIpcHandlers }; 