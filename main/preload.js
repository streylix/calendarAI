const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    // Events
    saveEvent: (event) => ipcRenderer.invoke('saveEvent', event),
    getEvents: () => ipcRenderer.invoke('getEvents'),
    updateEvent: (event) => ipcRenderer.invoke('updateEvent', event),
    deleteEvent: (eventId) => ipcRenderer.invoke('deleteEvent', eventId),
    
    // AI integration
    processAIPrompt: (prompt) => ipcRenderer.invoke('processAIPrompt', prompt)
  }
); 