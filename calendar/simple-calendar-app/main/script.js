document.addEventListener('DOMContentLoaded', () => {
  // Calendar state
  let currentDate = new Date();
  let currentView = 'month';
  let customDays = 3; // Default number of days for custom view
  let showWeekends = true;
  let showDeclinedEvents = true;
  let showWeekNumbers = false;
  let isDragging = false;
  let dragStartCell = null;
  let dragEndCell = null;
  let dragIndicator = null;
  let isDraggingEvent = false;
  let draggingEvent = null;
  let eventDragOffset = { x: 0, y: 0 };
  let tempEventData = null;
  let events = []; // Store all events
  
  // Sidebar resize state
  let isSidebarResizing = false;
  let sidebarInitialWidth = 300; // Updated from 240px to 300px to match CSS
  let resizeStartX = 0;
  
  // DOM elements
  const viewDropdown = document.querySelector('.view-dropdown');
  const todayBtn = document.querySelector('.today-btn');
  const prevBtn = document.querySelector('.nav-icons .icon-btn:first-child');
  const nextBtn = document.querySelector('.nav-icons .icon-btn:last-child');
  const monthHeader = document.querySelector('.month-header');
  const calendarContainer = document.querySelector('.calendar-container');
  const sidebar = document.querySelector('.sidebar');
  const sidebarResizeHandle = document.querySelector('.sidebar-resize-handle');
  
  // Load saved events from localStorage if available
  function loadEvents() {
    try {
      const savedEvents = localStorage.getItem('calendarEvents');
      if (savedEvents) {
        events = JSON.parse(savedEvents);
      }
    } catch (e) {
      console.error('Error loading events:', e);
    }
  }
  
  // Save events to localStorage
  function saveEvents() {
    try {
      localStorage.setItem('calendarEvents', JSON.stringify(events));
    } catch (e) {
      console.error('Error saving events:', e);
    }
  }
  
  // Update the calendar header
  function updateCalendarHeader() {
    let headerText = '';
    
    if (currentView === 'custom') {
      // For custom days view, show date range
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() + customDays - 1);
      
      // If same month
      if (startDate.getMonth() === endDate.getMonth()) {
        headerText = `${startDate.toLocaleDateString('en-US', { month: 'long' })} ${startDate.getDate()}-${endDate.getDate()}, ${startDate.getFullYear()}`;
      } else {
        headerText = `${startDate.toLocaleDateString('en-US', { month: 'short' })} ${startDate.getDate()} - ${endDate.toLocaleDateString('en-US', { month: 'short' })} ${endDate.getDate()}, ${startDate.getFullYear()}`;
      }
    } else {
      // For day, week, or month views
      const options = { month: 'long', year: 'numeric' };
      headerText = currentDate.toLocaleDateString(undefined, options);
    }
    
    monthHeader.textContent = headerText;
  }
  
  // Format hours for display (12-hour format with AM/PM)
  function formatHour(hour) {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  }
  
  // Get current time position as percentage within the current hour cell
  function getCurrentTimePosition() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Calculate percentage within the current hour (0-100%)
    const percentageWithinHour = (minutes / 60) * 100;
    
    return {
      hour: hours,
      percentageWithinHour,
      timeString: now.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})
    };
  }
  
  // Function to update time indicator
  function updateTimeIndicator() {
    const { hour, percentageWithinHour, timeString } = getCurrentTimePosition();
    
    // Find the hour cell for the current hour
    const hourCells = document.querySelectorAll('.hour-cell[data-hour="' + hour + '"]');
    hourCells.forEach(cell => {
      if (!cell.querySelector('.current-time-indicator')) {
        // Create the indicator if it doesn't exist
        const indicator = document.createElement('div');
        indicator.className = 'current-time-indicator';
        
        const timeText = document.createElement('span');
        timeText.className = 'time-text';
        timeText.textContent = timeString;
        
        indicator.appendChild(timeText);
        cell.appendChild(indicator);
      }
      
      // Update position
      const indicator = cell.querySelector('.current-time-indicator');
      indicator.style.top = `${percentageWithinHour}%`;
      
      // Update time text
      const timeText = indicator.querySelector('.time-text');
      if (timeText) {
        timeText.textContent = timeString;
      }
    });
  }
  
  // Generate month view calendar
  function generateMonthView() {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Calculate days from previous month to display
    const prevMonthDays = firstDayOfWeek;
    
    // Calculate total cells needed (previous month days + current month days + enough to fill out the grid)
    let totalCells = prevMonthDays + daysInMonth;
    totalCells += (7 - (totalCells % 7)) % 7; // Add remaining days to complete the grid
    
    let html = `
      <div class="calendar-header">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>
      <div class="calendar">
    `;
    
    // Get the current real date for highlighting today
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentDate.getMonth() && 
                           today.getFullYear() === currentDate.getFullYear();
    
    // Previous month days
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    const prevMonthTotalDays = prevMonth.getDate();
    
    let dayCounter = 1;
    let nextMonthDay = 1;
    
    for (let i = 0; i < totalCells; i++) {
      if (i < prevMonthDays) {
        // Previous month
        const day = prevMonthTotalDays - (prevMonthDays - i - 1);
        html += `
          <div class="calendar-cell other-month">
            <div class="date-number">${day}</div>
          </div>
        `;
      } else if (dayCounter <= daysInMonth) {
        // Current month
        const isToday = isCurrentMonth && today.getDate() === dayCounter;
        html += `
          <div class="calendar-cell${isToday ? ' current-day' : ''}">
            <div class="date-number">${dayCounter}</div>
            ${dayCounter === 11 && isCurrentMonth ? '<div class="calendar-event green-event">Mother\'s Day</div>' : ''}
            ${dayCounter === 24 && isCurrentMonth ? '<div class="calendar-event blue-event">Mom\'s birthday</div>' : ''}
            ${dayCounter === 26 && isCurrentMonth ? '<div class="calendar-event green-event">Memorial Day</div>' : ''}
          </div>
        `;
        dayCounter++;
      } else {
        // Next month
        html += `
          <div class="calendar-cell other-month">
            <div class="date-number">${nextMonthDay}</div>
          </div>
        `;
        nextMonthDay++;
      }
    }
    
    html += '</div>';
    return html;
  }
  
  // Generate week view calendar
  function generateWeekView() {
    // Calculate the start of the week (Sunday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    // Create array of 7 days starting from Sunday
    const weekDays = Array.from({length: 7}, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
    
    // Get the current real date for highlighting today
    const today = new Date();
    
    // Get current time info
    const { hour: currentHour, percentageWithinHour, timeString } = getCurrentTimePosition();
    
    let html = `
      <div class="week-view">
        <div class="week-header">
          <div class="time-column">EDT</div>
    `;
    
    // Add day headers
    weekDays.forEach(date => {
      const isToday = date.getDate() === today.getDate() && 
                      date.getMonth() === today.getMonth() && 
                      date.getFullYear() === today.getFullYear();
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = date.getDate();
      
      html += `
        <div class="day-column-header${isToday ? ' today-column' : ''}">
          ${dayName} ${dayNumber}${isToday ? ' <span class="today-marker">12</span>' : ''}
        </div>
      `;
    });
    
    html += `
        </div>
        <div class="week-grid">
          <div class="time-column">
            <div class="all-day-row">All-day</div>
    `;
    
    // Add time rows
    for (let hour = 0; hour < 24; hour++) {
      html += `<div class="time-slot">${formatHour(hour)}</div>`;
    }
    
    html += `
          </div>
    `;
    
    // Add columns for each day
    weekDays.forEach((date, dayIndex) => {
      const isToday = date.getDate() === today.getDate() && 
                       date.getMonth() === today.getMonth() && 
                       date.getFullYear() === today.getFullYear();
      
      // Format date as string in local timezone (YYYY-MM-DD)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      console.log('Week view generating date cell:', formattedDate, 'for day:', date.toLocaleDateString());
      
      html += `
        <div class="day-column${isToday ? ' today-column' : ''}">
          <div class="all-day-cell" data-date="${formattedDate}">
            ${dayIndex === 0 && date.getDate() === 11 ? '<div class="week-event">Moth...</div>' : ''}
          </div>
      `;
      
      // Add cells for 24 hours
      for (let hour = 0; hour < 24; hour++) {
        html += `
          <div class="hour-cell" data-hour="${hour}" data-date="${formattedDate}">
            ${isToday && hour === currentHour ? `<div class="current-time-indicator"><span class="time-text">${timeString}</span></div>` : ''}
          </div>
        `;
      }
      
      html += `</div>`;
    });
    
    html += `</div></div>`;
    return html;
  }
  
  // Generate day view calendar
  function generateDayView() {
    // Get the current real date for highlighting today
    const today = new Date();
    const isToday = today.getDate() === currentDate.getDate() && 
                     today.getMonth() === currentDate.getMonth() && 
                     today.getFullYear() === currentDate.getFullYear();
    
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDate.getDay()];
    const dayOfMonth = currentDate.getDate();
    
    // Get current time info
    const { hour: currentHour, timeString } = getCurrentTimePosition();
    
    // Format date as ISO string in local timezone (YYYY-MM-DD)
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    console.log('Day view generating with date:', formattedDate);
    
    let html = `
      <div class="day-view">
        <div class="day-header">
          <div class="time-column">EDT</div>
          <div class="day-column-header${isToday ? ' today-column' : ''}">
            ${dayOfWeek} ${dayOfMonth}${isToday ? ' <span class="today-marker">12</span>' : ''}
          </div>
        </div>
        <div class="day-grid">
          <div class="time-column">
            <div class="all-day-row">All-day</div>
    `;
    
    // Add time rows for 24 hours
    for (let hour = 0; hour < 24; hour++) {
      html += `<div class="time-slot">${formatHour(hour)}</div>`;
    }
    
    html += `
          </div>
          <div class="day-column${isToday ? ' today-column' : ''}">
            <div class="all-day-cell" data-date="${formattedDate}"></div>
    `;
    
    // Add cells for 24 hours
    for (let hour = 0; hour < 24; hour++) {
      html += `
        <div class="hour-cell" data-hour="${hour}" data-date="${formattedDate}">
          ${isToday && hour === currentHour ? `<div class="current-time-indicator"><span class="time-text">${timeString}</span></div>` : ''}
        </div>
      `;
    }
    
    html += `</div></div></div>`;
    return html;
  }
  
  // Generate custom days view calendar (for "Number of days" options)
  function generateCustomDaysView() {
    const days = [];
    for (let i = 0; i < customDays; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() + i);
      days.push(date);
    }
    
    // Get the current real date for highlighting today
    const today = new Date();
    
    let html = `
      <div class="custom-days-view">
        <div class="days-header">
          <div class="time-column">EDT</div>
    `;
    
    // Add column headers with dates
    days.forEach(date => {
      const isToday = date.getDate() === today.getDate() && 
                       date.getMonth() === today.getMonth() && 
                       date.getFullYear() === today.getFullYear();
      
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      const dayOfMonth = date.getDate();
      
      // Skip weekends if showWeekends is false
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      if (!showWeekends && isWeekend) {
        return;
      }
      
      html += `
        <div class="day-column-header${isToday ? ' today-column' : ''}">
          ${dayOfWeek} ${dayOfMonth}${isToday ? ' <span class="today-marker">12</span>' : ''}
        </div>
      `;
    });
    
    html += `
        </div>
        <div class="days-grid">
          <div class="time-column">
            <div class="all-day-row">All-day</div>
    `;
    
    // Add week number if enabled
    if (showWeekNumbers) {
      const weekNum = getWeekNumber(currentDate);
      html += `<div class="week-number">Week ${weekNum}</div>`;
    }
    
    // Add time rows
    for (let hour = 4; hour <= 11; hour++) {
      html += `<div class="time-slot">${hour} PM</div>`;
    }
    
    html += `
          </div>
    `;
    
    // Add columns for each day
    days.forEach((date, dayIndex) => {
      // Skip weekends if showWeekends is false
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      if (!showWeekends && isWeekend) {
        return;
      }
      
      const isToday = date.getDate() === today.getDate() && 
                       date.getMonth() === today.getMonth() && 
                       date.getFullYear() === today.getFullYear();
      
      html += `
        <div class="day-column${isToday ? ' today-column' : ''}">
          <div class="all-day-cell">
            ${date.getDate() === 11 && date.getMonth() === 4 ? '<div class="week-event">Mother\'s Day</div>' : ''}
          </div>
      `;
      
      // Add cells for each hour
      for (let hour = 4; hour <= 11; hour++) {
        html += `
          <div class="hour-cell">
            ${hour === 9 && isToday ? '<div class="time-indicator">9:10 PM</div>' : ''}
          </div>
        `;
      }
      
      html += `</div>`;
    });
    
    html += `</div></div>`;
    return html;
  }
  
  // Helper function to get week number
  function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  }
  
  // Create event sidebar form - updated to handle editing existing events
  function showEventSidebar(eventData, isEdit = false) {
    // Store temp event data
    tempEventData = eventData;
    
    // Clear any previous selection boxes
    const existingSelections = document.querySelectorAll('.drag-event-selection');
    existingSelections.forEach(selection => selection.remove());
    
    // Get the existing sidebar from the HTML
    const eventSidebar = document.querySelector('.create-event-sidebar');
    
    // Log raw values for debugging
    console.log('Raw event data startDate received by sidebar:', eventData.startDate);
    console.log('Raw event data:', eventData);
    
    // Parse the date strings to create new Date objects in local time
    let startDate, endDate;
    
    // Split the date string (YYYY-MM-DD) into components
    if (eventData.startDate && eventData.startDate.includes('-')) {
      const [year, month, day] = eventData.startDate.split('-').map(Number);
      // Create date with local components (months are 0-indexed in JS)
      startDate = new Date(year, month - 1, day);
      
      if (eventData.startHour && eventData.startHour !== 'all-day') {
        const hour = parseInt(eventData.startHour);
        const minute = parseInt(eventData.startMinute || 0);
        startDate.setHours(hour, minute);
      } else if (eventData.startTime) {
        // If editing an existing event, use its start time
        const [hours, minutes] = eventData.startTime.split(':').map(Number);
        startDate.setHours(hours, minutes);
      }
    } else {
      // Fallback if date format is unexpected
      startDate = new Date();
    }
    
    // Do the same for end date
    if (eventData.endDate && eventData.endDate.includes('-')) {
      const [year, month, day] = eventData.endDate.split('-').map(Number);
      endDate = new Date(year, month - 1, day);
      
      if (eventData.endHour && eventData.endHour !== 'all-day') {
        const hour = parseInt(eventData.endHour);
        const minute = parseInt(eventData.endMinute || 0);
        endDate.setHours(hour, minute);
      } else if (eventData.endTime) {
        // If editing an existing event, use its end time
        const [hours, minutes] = eventData.endTime.split(':').map(Number);
        endDate.setHours(hours, minutes);
      }
    } else {
      endDate = new Date(startDate);
      // Default to 1 hour later if no end time provided
      endDate.setHours(endDate.getHours() + 1);
    }
    
    console.log('Sidebar using dates:', 
      'Start:', startDate.toLocaleString(), 
      'End:', endDate.toLocaleString()
    );
    
    // Format dates for input fields - use local timezone format
    const formatDateForInput = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const formatTimeForInput = (date) => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };
    
    // Update the event form title
    const formTitle = eventSidebar.querySelector('.event-form-title');
    if (formTitle) {
      formTitle.textContent = isEdit ? 'Edit event' : 'Create event';
    }
    
    // Update form fields
    const titleInput = eventSidebar.querySelector('#event-title');
    if (titleInput) titleInput.value = eventData.title || '';
    
    const startDateInput = eventSidebar.querySelector('#event-start-date');
    if (startDateInput) startDateInput.value = formatDateForInput(startDate);
    
    const startTimeInput = eventSidebar.querySelector('#event-start-time');
    if (startTimeInput) {
      startTimeInput.value = formatTimeForInput(startDate);
      startTimeInput.disabled = eventData.allDay;
      // Show/hide the time input based on all-day status
      if (startTimeInput.parentElement) {
        startTimeInput.parentElement.style.display = eventData.allDay ? 'none' : 'block';
      }
    }
    
    const endDateInput = eventSidebar.querySelector('#event-end-date');
    if (endDateInput) endDateInput.value = formatDateForInput(endDate);
    
    const endTimeInput = eventSidebar.querySelector('#event-end-time');
    if (endTimeInput) {
      endTimeInput.value = formatTimeForInput(endDate);
      endTimeInput.disabled = eventData.allDay;
      // Show/hide the time input based on all-day status
      if (endTimeInput.parentElement) {
        endTimeInput.parentElement.style.display = eventData.allDay ? 'none' : 'block';
      }
    }
    
    const allDayCheckbox = eventSidebar.querySelector('#all-day');
    if (allDayCheckbox) allDayCheckbox.checked = eventData.allDay;
    
    const locationInput = eventSidebar.querySelector('#event-location');
    if (locationInput) locationInput.value = eventData.location || '';
    
    const descriptionInput = eventSidebar.querySelector('#event-description');
    if (descriptionInput) descriptionInput.value = eventData.description || '';
    
    // Set color selection
    const colorOptions = eventSidebar.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
      option.classList.remove('selected');
      
      if (option.dataset.color === (eventData.color || 'blue')) {
        option.classList.add('selected');
      }
    });
    
    // Show sidebar by adding active class
    eventSidebar.classList.add('active');
    
    // Set up event handlers
    const backBtn = eventSidebar.querySelector('.back-btn');
    const cancelBtn = eventSidebar.querySelector('.cancel-btn');
    const saveBtn = eventSidebar.querySelector('.save-btn');
    
    // Function to close the sidebar
    const closeSidebar = () => {
      eventSidebar.classList.remove('active');
      
      // Remove selection box if canceling
      const selectionBox = document.querySelector('.drag-event-selection');
      if (selectionBox) selectionBox.remove();
      
      tempEventData = null;
    };
    
    // Set up click handlers
    if (backBtn) backBtn.addEventListener('click', closeSidebar);
    if (cancelBtn) cancelBtn.addEventListener('click', closeSidebar);
    
    // Remove any previous listeners to avoid duplicates
    if (saveBtn) {
      const clone = saveBtn.cloneNode(true);
      saveBtn.parentNode.replaceChild(clone, saveBtn);
      
      // Add new event listener
      clone.addEventListener('click', () => {
        // Get the values from the form
        const startDateStr = eventSidebar.querySelector('#event-start-date').value;
        const startTimeStr = eventSidebar.querySelector('#event-start-time').value;
        const endDateStr = eventSidebar.querySelector('#event-end-date').value;
        const endTimeStr = eventSidebar.querySelector('#event-end-time').value;
        const isAllDay = eventSidebar.querySelector('#all-day').checked;
        
        // Get selected color
        let color = 'blue'; // Default color
        const selectedColorElement = eventSidebar.querySelector('.color-option.selected');
        if (selectedColorElement) {
          color = selectedColorElement.dataset.color;
        }
        
        // Create new event data
        const newEventData = {
          id: eventData.id || Date.now().toString(), // Use existing ID or create new one
          title: eventSidebar.querySelector('#event-title').value,
          startDate: startDateStr,
          startTime: isAllDay ? '00:00' : startTimeStr,
          endDate: endDateStr,
          endTime: isAllDay ? '23:59' : endTimeStr,
          allDay: isAllDay,
          location: eventSidebar.querySelector('#event-location').value,
          description: eventSidebar.querySelector('#event-description').value,
          color: color
        };
        
        console.log('Saving event with data:', newEventData);
        
        // If editing, find and update the existing event
        if (isEdit && eventData.id) {
          const eventIndex = events.findIndex(e => e.id === eventData.id);
          if (eventIndex !== -1) {
            events[eventIndex] = newEventData;
          }
        } else {
          // Add new event
          events.push(newEventData);
        }
        
        // Save events to localStorage
        saveEvents();
        
        // Re-render the calendar
        renderCalendar();
        
        // Close sidebar
        closeSidebar();
      });
    }
    
    // Handle all-day toggle
    if (allDayCheckbox) {
      // Remove any previous listeners
      const allDayClone = allDayCheckbox.cloneNode(true);
      allDayCheckbox.parentNode.replaceChild(allDayClone, allDayCheckbox);
      
      // Add new event listener
      allDayClone.addEventListener('change', () => {
        const startTime = eventSidebar.querySelector('#event-start-time');
        const endTime = eventSidebar.querySelector('#event-end-time');
        
        if (startTime) {
          startTime.disabled = allDayClone.checked;
          if (startTime.parentElement) {
            startTime.parentElement.style.display = allDayClone.checked ? 'none' : 'block';
          }
        }
        
        if (endTime) {
          endTime.disabled = allDayClone.checked;
          if (endTime.parentElement) {
            endTime.parentElement.style.display = allDayClone.checked ? 'none' : 'block';
          }
        }
      });
    }
    
    // Setup color option selection
    colorOptions.forEach(option => {
      // Remove any previous listeners
      const optionClone = option.cloneNode(true);
      option.parentNode.replaceChild(optionClone, option);
      
      // Add new event listener
      optionClone.addEventListener('click', () => {
        // Remove selection from all
        eventSidebar.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        // Add to this one
        optionClone.classList.add('selected');
      });
    });
  }
  
  // Make showEventSidebar accessible globally so it can be called from HTML
  window.showEventSidebar = showEventSidebar;
  
  // Handle start of dragging
  function handleDragStart(e) {
    // Check if we're clicking on an existing event
    if (e.target.classList.contains('calendar-event')) {
      isDraggingEvent = true;
      draggingEvent = e.target;
      
      // Store the original event data for reference
      const eventId = draggingEvent.dataset.id;
      const eventData = events.find(event => event.id === eventId);
      
      if (eventData) {
        // Store original duration for preserving event length
        if (!eventData.allDay) {
          // Parse times to calculate duration
          const [startHour, startMin] = eventData.startTime.split(':').map(Number);
          const [endHour, endMin] = eventData.endTime.split(':').map(Number);
          
          // Calculate duration in minutes
          let durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
          // Handle cases where end time is on the next day
          if (durationMinutes <= 0) {
            durationMinutes += 24 * 60;
          }
          
          // Store the duration
          draggingEvent.dataset.durationMinutes = durationMinutes;
          console.log('Event duration:', durationMinutes, 'minutes');
        }
      }
      
      // Calculate offset from event edge
      const rect = draggingEvent.getBoundingClientRect();
      eventDragOffset.x = e.clientX - rect.left;
      eventDragOffset.y = e.clientY - rect.top;
      
      // Add dragging class
      draggingEvent.classList.add('dragging');
      return;
    }
    
    // Otherwise, start creating a new event
    if (e.target.classList.contains('hour-cell') || e.target.classList.contains('all-day-cell')) {
      isDragging = true;
      dragStartCell = e.target;
      
      // Create drag indicator
      dragIndicator = document.createElement('div');
      dragIndicator.className = 'drag-event-indicator';
      
      // Position at mouse pointer
      const rect = dragStartCell.getBoundingClientRect();
      dragIndicator.style.position = 'absolute';
      dragIndicator.style.left = `${rect.left}px`;
      dragIndicator.style.top = `${e.clientY}px`;
      dragIndicator.style.width = `${rect.width}px`;
      dragIndicator.style.height = '0px';
      dragIndicator.style.backgroundColor = 'rgba(66, 133, 244, 0.3)';
      dragIndicator.style.border = '1px solid rgba(66, 133, 244, 0.8)';
      dragIndicator.style.pointerEvents = 'none';
      dragIndicator.style.zIndex = '100';
      
      document.body.appendChild(dragIndicator);
    }
  }
  
  // Handle dragging
  function handleDragging(e) {
    // Handle dragging existing events
    if (isDraggingEvent && draggingEvent) {
      // Find the calendar container boundaries
      const calendarRect = calendarContainer.getBoundingClientRect();
      const eventWidth = draggingEvent.offsetWidth;
      const eventHeight = draggingEvent.offsetHeight;
      
      // Calculate position while keeping event within calendar boundaries
      let left = e.clientX - eventDragOffset.x;
      let top = e.clientY - eventDragOffset.y;
      
      // Constrain to calendar boundaries
      left = Math.max(calendarRect.left, Math.min(calendarRect.right - eventWidth, left));
      top = Math.max(calendarRect.top, Math.min(calendarRect.bottom - eventHeight, top));
      
      // Find the cell under the mouse pointer - use better detection
      let cellUnder = null;
      
      // Get all hour cells and find the one that contains this point
      const hourCells = document.querySelectorAll('.hour-cell');
      for (const cell of hourCells) {
        const cellRect = cell.getBoundingClientRect();
        // Check if point is inside this cell
        if (
          left + (eventWidth / 2) >= cellRect.left && 
          left + (eventWidth / 2) <= cellRect.right &&
          top + 10 >= cellRect.top && 
          top + 10 <= cellRect.bottom
        ) {
          cellUnder = cell;
          break;
        }
      }
      
      // If no hour cell, check if it's over an all-day cell
      if (!cellUnder) {
        const allDayCells = document.querySelectorAll('.all-day-cell');
        for (const cell of allDayCells) {
          const cellRect = cell.getBoundingClientRect();
          if (
            left + (eventWidth / 2) >= cellRect.left && 
            left + (eventWidth / 2) <= cellRect.right &&
            top + 10 >= cellRect.top && 
            top + 10 <= cellRect.bottom
          ) {
            cellUnder = cell;
            break;
          }
        }
      }
      
      if (cellUnder && cellUnder.classList.contains('hour-cell')) {
        // Get the cell dimensions
        const cellRect = cellUnder.getBoundingClientRect();
        
        // Snap to 15-minute intervals within the hour
        const cellTop = cellRect.top;
        const cellHeight = cellRect.height;
        
        // Calculate relative position within the cell (0-1)
        const relativePos = (top - cellTop) / cellHeight;
        
        // Snap to nearest 15-minute interval (0, 0.25, 0.5, 0.75)
        const snapPoints = [0, 0.25, 0.5, 0.75, 1];
        const snapIndex = snapPoints.reduce((closest, current, index) => {
          return Math.abs(current - relativePos) < Math.abs(snapPoints[closest] - relativePos) 
            ? index 
            : closest;
        }, 0);
        
        // Set top position to the snapped position
        const snappedTop = cellTop + (snapPoints[snapIndex] * cellHeight);
        
        // Visualize the target position
        draggingEvent.style.position = 'absolute';
        draggingEvent.style.left = `${cellRect.left}px`;
        draggingEvent.style.top = `${snappedTop}px`;
        draggingEvent.style.width = cellRect.width + 'px';
        draggingEvent.style.zIndex = '1000';
        
        // Store the target hour and minute for later use when saving
        const hourValue = parseInt(cellUnder.dataset.hour || '0');
        const minuteValue = Math.round(snapPoints[snapIndex] * 60);
        
        draggingEvent.dataset.targetHour = hourValue;
        draggingEvent.dataset.targetMinute = minuteValue;
        draggingEvent.dataset.targetDate = cellUnder.dataset.date;
        
        // Show feedback
        draggingEvent.setAttribute('title', `${hourValue}:${minuteValue.toString().padStart(2, '0')}`);
      } else if (cellUnder && cellUnder.classList.contains('all-day-cell')) {
        // Handle dragging to all-day cell
        const cellRect = cellUnder.getBoundingClientRect();
        
        draggingEvent.style.position = 'absolute';
        draggingEvent.style.left = `${cellRect.left}px`;
        draggingEvent.style.top = `${cellRect.top}px`;
        draggingEvent.style.width = cellRect.width + 'px';
        draggingEvent.style.height = 'auto';
        draggingEvent.style.zIndex = '1000';
        
        draggingEvent.dataset.targetDate = cellUnder.dataset.date;
        draggingEvent.dataset.allDay = 'true';
      }
      return;
    }
    
    // Handle creating new events
    if (isDragging && dragIndicator) {
      const rect = dragStartCell.getBoundingClientRect();
      let height = e.clientY - dragStartCell.getBoundingClientRect().top;
      
      // Ensure minimum height
      if (height < 10) height = 10;
      
      // Snap height to 15-minute intervals (each 15 min is 25% of hour height)
      const hourHeight = rect.height;
      const snapHeight = Math.round(height / (hourHeight * 0.25)) * (hourHeight * 0.25);
      
      dragIndicator.style.height = `${snapHeight}px`;
      
      // Determine which cell we're over
      const elemBelow = document.elementFromPoint(
        rect.left + rect.width / 2,
        e.clientY
      );
      
      if (elemBelow && (elemBelow.classList.contains('hour-cell') || elemBelow.classList.contains('all-day-cell'))) {
        dragEndCell = elemBelow;
      }
    }
  }
  
  // Handle end of dragging
  function handleDragEnd(e) {
    // Handle dropping an existing event
    if (isDraggingEvent && draggingEvent) {
      // Get the event ID and find it in our array
      const eventId = draggingEvent.dataset.id;
      const eventIndex = events.findIndex(event => event.id === eventId);
      
      if (eventIndex !== -1) {
        // Check if we have target data from dragging
        if (draggingEvent.dataset.targetDate) {
          // Get the original event to preserve data
          const originalEvent = {...events[eventIndex]};
          
          // Handle dropping on all-day cell
          if (draggingEvent.dataset.allDay === 'true') {
            events[eventIndex].allDay = true;
            events[eventIndex].startDate = draggingEvent.dataset.targetDate;
            events[eventIndex].endDate = draggingEvent.dataset.targetDate;
          } else if (draggingEvent.dataset.targetHour !== undefined) {
            // Handle dropping on hour cell
            const newHour = parseInt(draggingEvent.dataset.targetHour);
            const newMinute = parseInt(draggingEvent.dataset.targetMinute || '0');
            const newDate = draggingEvent.dataset.targetDate;
            
            // Update start time
            events[eventIndex].allDay = false;
            events[eventIndex].startDate = newDate;
            events[eventIndex].startTime = `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
            
            // Calculate end time based on original duration
            if (draggingEvent.dataset.durationMinutes) {
              const durationMinutes = parseInt(draggingEvent.dataset.durationMinutes);
              
              // Calculate new end time
              let endMinutes = newHour * 60 + newMinute + durationMinutes;
              let endHour = Math.floor(endMinutes / 60) % 24;
              let endMinute = endMinutes % 60;
              
              // Handle day overflow
              if (endHour < newHour && endMinute < newMinute) {
                // End time is on the next day
                const startDateTime = new Date(`${newDate}T00:00:00`);
                startDateTime.setDate(startDateTime.getDate() + 1);
                
                const year = startDateTime.getFullYear();
                const month = String(startDateTime.getMonth() + 1).padStart(2, '0');
                const day = String(startDateTime.getDate()).padStart(2, '0');
                
                events[eventIndex].endDate = `${year}-${month}-${day}`;
              } else {
                events[eventIndex].endDate = newDate;
              }
              
              events[eventIndex].endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
            } else {
              // Fallback: set end time 1 hour after start if no duration known
              const endHour = (newHour + 1) % 24;
              events[eventIndex].endDate = newDate;
              events[eventIndex].endTime = `${endHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
            }
            
            console.log('Updated event times:', 
              events[eventIndex].startDate, events[eventIndex].startTime, 
              'to', events[eventIndex].endDate, events[eventIndex].endTime
            );
          }
          
          // Save changes
          saveEvents();
          
          // Re-render calendar to reflect updated events
          renderCalendar();
        } else {
          // Re-render calendar to reset event positions
          renderCalendar();
        }
      }
      
      // Clean up after drag operation
      draggingEvent.style.position = '';
      draggingEvent.style.left = '';
      draggingEvent.style.top = '';
      draggingEvent.style.width = '';
      draggingEvent.style.height = '';
      draggingEvent.style.zIndex = '';
      draggingEvent.classList.remove('dragging');
      
      // Clean up
      isDraggingEvent = false;
      draggingEvent = null;
      return;
    }
    
    // Fix date handling in new event creation
    if (isDragging && dragStartCell && dragEndCell) {
      // Convert drag indicator to selection box that stays visible
      const selectionBox = document.createElement('div');
      selectionBox.className = 'drag-event-selection';
      selectionBox.style.position = 'absolute';
      selectionBox.style.left = dragIndicator.style.left;
      selectionBox.style.top = dragIndicator.style.top;
      selectionBox.style.width = dragIndicator.style.width;
      selectionBox.style.height = dragIndicator.style.height;
      selectionBox.style.backgroundColor = 'rgba(66, 133, 244, 0.3)';
      selectionBox.style.border = '1px solid rgba(66, 133, 244, 0.8)';
      selectionBox.style.zIndex = '100';
      
      // Clean up temporary indicator
      document.body.removeChild(dragIndicator);
      document.body.appendChild(selectionBox);
      
      // Get data from cells
      const startDate = dragStartCell.dataset.date;
      const startHour = dragStartCell.dataset.hour || 'all-day';
      
      // For end cell, calculate minutes based on drag height
      let endDate = dragEndCell.dataset.date;
      let endHour = dragEndCell.dataset.hour || 'all-day';
      let startMinute = 0;
      let endMinute = 0;
      
      // If both are hour cells, calculate precise minutes
      if (startHour !== 'all-day' && endHour !== 'all-day') {
        const startRect = dragStartCell.getBoundingClientRect();
        const dragTop = parseInt(selectionBox.style.top);
        const dragBottom = dragTop + parseInt(selectionBox.style.height);
        
        // Calculate start minute (0-59) based on position within start cell
        const relativeStartPos = (dragTop - startRect.top) / startRect.height;
        startMinute = Math.round(relativeStartPos * 60 / 15) * 15; // Snap to 15-min intervals
        
        // For end time, get the bottom position
        if (dragEndCell === dragStartCell) {
          // Same cell - calculate end minute
          const relativeEndPos = (dragBottom - startRect.top) / startRect.height;
          endMinute = Math.round(relativeEndPos * 60 / 15) * 15; // Snap to 15-min intervals
          if (endMinute === 60) {
            endMinute = 0;
            endHour = (parseInt(endHour) + 1).toString();
          }
        } else {
          // Different cell - calculate end minute
          const endRect = dragEndCell.getBoundingClientRect();
          const relativeEndPos = (dragBottom - endRect.top) / endRect.height;
          endMinute = Math.round(relativeEndPos * 60 / 15) * 15; // Snap to 15-min intervals
          if (endMinute === 60) {
            endMinute = 0;
            endHour = (parseInt(endHour) + 1).toString();
          }
        }
      }
      
      console.log('Creating event with start date from cell data attribute:', startDate);
      console.log('Start time:', startHour, ':', startMinute, 'End time:', endHour, ':', endMinute);
      
      // Show event sidebar - Create a new event data object with the properly formatted date
      showEventSidebar({
        startDate,
        startHour: startHour,
        startMinute: startMinute,
        endDate,
        endHour: endHour,
        endMinute: endMinute,
        allDay: startHour === 'all-day'
      });
    }
    
    // Reset drag state
    isDragging = false;
    dragStartCell = null;
    dragEndCell = null;
    dragIndicator = null;
  }
  
  // Create a new event
  function createEvent(eventData) {
    // Create event element
    const eventElement = document.createElement('div');
    eventElement.className = `calendar-event ${eventData.color || 'blue'}-event`;
    
    // Format time string for display
    let timeStr = '';
    if (!eventData.allDay) {
      // Parse start and end times
      const startHour = eventData.startTime.split(':')[0];
      const startMin = eventData.startTime.split(':')[1];
      const endHour = eventData.endTime.split(':')[0];
      const endMin = eventData.endTime.split(':')[1];
      
      // Format 12-hour time
      const formatTime = (hour, min) => {
        const h = parseInt(hour);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hr = h % 12 || 12;
        return `${hr}:${min} ${ampm}`;
      };
      
      timeStr = `${formatTime(startHour, startMin)} - ${formatTime(endHour, endMin)}`;
    }
    
    // Create event content
    eventElement.innerHTML = `
      <div class="event-title">${eventData.title}</div>
      ${!eventData.allDay ? `<div class="event-time">${timeStr}</div>` : ''}
      ${eventData.location ? `<div class="event-location">${eventData.location}</div>` : ''}
    `;
    
    // Store event data for dragging and reference
    eventElement.dataset.id = eventData.id;
    Object.keys(eventData).forEach(key => {
      eventElement.dataset[key] = eventData[key];
    });
    
    // Determine where to place the event
    let targetCell;
    
    // Debug date information
    console.log('Looking for cell to place event with date:', eventData.startDate);
    
    if (eventData.allDay) {
      // All-day event
      targetCell = document.querySelector(`.all-day-cell[data-date="${eventData.startDate}"]`);
      console.log('Looking for all-day cell with data-date=', eventData.startDate);
      if (!targetCell) {
        // For debugging, log all available cell dates
        const allCells = document.querySelectorAll('.all-day-cell[data-date]');
        console.log('Available all-day cells:', Array.from(allCells).map(cell => cell.dataset.date));
      }
    } else {
      // Get start hour from time string (HH:MM)
      const [startHour, startMinute] = eventData.startTime.split(':').map(Number);
      
      // Hourly event - find the starting hour cell
      targetCell = document.querySelector(`.hour-cell[data-date="${eventData.startDate}"][data-hour="${startHour}"]`);
      console.log('Looking for hour cell with data-date=', eventData.startDate, 'and hour=', startHour);
      
      if (targetCell) {
        // Calculate duration
        try {
          // Use the local date components to create Date objects without timezone issues
          const [startYear, startMonth, startDay] = eventData.startDate.split('-').map(Number);
          const [endYear, endMonth, endDay] = eventData.endDate.split('-').map(Number);
          const [startHour, startMinute] = eventData.startTime.split(':').map(Number);
          const [endHour, endMinute] = eventData.endTime.split(':').map(Number);
          
          // Create dates using local components (month is 0-indexed)
          const startDateTime = new Date(startYear, startMonth - 1, startDay, startHour, startMinute);
          const endDateTime = new Date(endYear, endMonth - 1, endDay, endHour, endMinute);
          
          console.log('Event duration calculation:', 
            'Start:', startDateTime.toLocaleString(), 
            'End:', endDateTime.toLocaleString()
          );
          
          const durationHours = (endDateTime - startDateTime) / (1000 * 60 * 60);
          
          if (durationHours > 0) {
            // Set height proportional to duration
            eventElement.style.height = `${durationHours * 100}%`;
            
            // Calculate the position from the top of the hour based on minutes
            // Each minute is 1/60 of the cell height
            const minuteOffset = (startMinute / 60) * 100;
            
            // Position the event with the minute offset
            eventElement.style.position = 'absolute';
            eventElement.style.top = `${minuteOffset}%`;
            eventElement.style.left = '0';
            eventElement.style.right = '0';
            
            console.log(`Positioning event with minute offset ${minuteOffset}% for ${startMinute} minutes`);
          }
        } catch (e) {
          console.error('Error calculating event duration:', e);
        }
      }
    }
    
    if (targetCell) {
      console.log('Found target cell for date:', eventData.startDate);
      // Make sure the cell has position relative for absolute positioning of children
      targetCell.style.position = 'relative';
      targetCell.appendChild(eventElement);
      
      // Setup event click handler to edit event
      eventElement.addEventListener('click', (e) => {
        e.stopPropagation();
        // Make a deep copy of the event data to avoid reference issues
        const eventDataCopy = JSON.parse(JSON.stringify(eventData));
        // Open the event in edit mode
        showEventSidebar(eventDataCopy, true);
      });
      
      return true;
    } else {
      console.error('Could not find target cell for date:', eventData.startDate);
      // Log all cell dates for debugging
      const allCells = document.querySelectorAll('[data-date]');
      console.log('All cells with data-date attributes:', 
        Array.from(allCells).map(cell => `${cell.classList.contains('hour-cell') ? 'hour' : 'all-day'}: ${cell.dataset.date}${cell.dataset.hour ? ' hour=' + cell.dataset.hour : ''}`)
      );
      return false;
    }
  }
  
  // Render the calendar based on current view and date
  function renderCalendar() {
    updateCalendarHeader();
    
    // Generate calendar based on current view
    let calendarHTML = '';
    
    switch(currentView) {
      case 'day':
        calendarHTML = generateDayView();
        break;
      case 'week':
        calendarHTML = generateWeekView();
        break;
      case 'custom':
        calendarHTML = generateCustomDaysView();
        break;
      case 'month':
      default:
        calendarHTML = generateMonthView();
        break;
    }
    
    calendarContainer.innerHTML = calendarHTML;
    
    // Render all saved events
    console.log('Rendering events:', events.length);
    events.forEach(event => {
      createEvent(event);
    });
    
    // Setup event handling for drag-to-create
    if (currentView === 'day' || currentView === 'week') {
      calendarContainer.addEventListener('mousedown', handleDragStart);
      document.addEventListener('mousemove', handleDragging);
      document.addEventListener('mouseup', handleDragEnd);
    }
    
    // Add custom styles for different views
    const styleEl = document.getElementById('dynamic-calendar-styles') || document.createElement('style');
    styleEl.id = 'dynamic-calendar-styles';
    
    const customStyles = `
      .day-view, .week-view, .custom-days-view {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      
      .day-header, .week-header, .days-header {
        display: flex;
        font-weight: 500;
        border-bottom: 1px solid var(--border-color);
      }
      
      .day-grid, .week-grid, .days-grid {
        display: flex;
        flex: 1;
        overflow-y: auto;
      }
      
      .time-column {
        width: 60px;
        flex-shrink: 0;
        border-right: 1px solid var(--border-color);
      }
      
      .day-column, .day-column-header {
        flex: 1;
        position: relative;
      }
      
      .time-slot, .all-day-row {
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        font-size: 14px;
        border-bottom: 1px solid var(--border-color);
      }
      
      .all-day-row {
        height: 40px;
      }
      
      .hour-cell, .all-day-cell {
        height: 60px;
        border-bottom: 1px solid var(--border-color);
        position: relative;
        box-sizing: border-box;
      }
      
      .all-day-cell {
        height: 40px;
      }
      
      .today-column {
        background-color: rgba(255, 255, 255, 0.05);
      }
      
      .today-marker {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background-color: var(--highlight-color);
        color: white;
        border-radius: 50%;
      }
      
      .time-indicator {
        position: absolute;
        left: 0;
        width: 100%;
        padding: 2px 4px;
        background-color: rgba(255, 87, 34, 0.8);
        color: white;
        font-size: 12px;
        border-radius: 3px;
      }
      
      .current-time-indicator {
        position: absolute;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: #ff0000;
        z-index: 10;
      }
      
      .current-time-indicator .time-text {
        position: absolute;
        left: 8px;
        top: -10px;
        background-color: #ff0000;
        color: white;
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 12px;
        font-weight: bold;
      }
      
      .week-event {
        background-color: rgba(76, 175, 80, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .week-number {
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        font-size: 14px;
        border-bottom: 1px solid var(--border-color);
      }
      
      .declined-event {
        opacity: 0.5;
        text-decoration: line-through;
      }
      
      .calendar-event {
        position: absolute;
        padding: 8px;
        margin-bottom: 4px;
        border-radius: 4px;
        font-size: 12px;
        overflow: hidden;
        cursor: pointer;
        z-index: 5;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        transition: box-shadow 0.2s ease;
        box-sizing: border-box;
        width: calc(100% - 8px);
        left: 4px; /* Add a small margin on the sides */
      }
      
      /* Specific styling for all-day events */
      .all-day-cell .calendar-event {
        position: relative;
        height: auto;
        width: auto;
        margin: 2px 4px;
        left: 0;
      }
      
      .calendar-event:hover {
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      
      .calendar-event.dragging {
        opacity: 0.8;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        cursor: move;
        z-index: 1000;
      }
      
      .event-title {
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .event-time, .event-location {
        font-size: 11px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        opacity: 0.8;
      }
      
      .drag-event-indicator, .drag-event-selection {
        position: absolute;
        pointer-events: none;
        z-index: 100;
      }
      
      .blue-event {
        background-color: rgba(33, 150, 243, 0.8);
        color: white;
      }
      
      .green-event {
        background-color: rgba(76, 175, 80, 0.8);
        color: white;
      }
      
      .purple-event {
        background-color: rgba(156, 39, 176, 0.8);
        color: white;
      }
      
      .red-event {
        background-color: rgba(244, 67, 54, 0.8);
        color: white;
      }
      
      .event-sidebar {
        position: fixed;
        top: 0;
        left: -400px;
        width: 380px;
        height: 100%;
        background-color: var(--sidebar-bg);
        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        overflow-y: auto;
        transition: left 0.3s ease;
        /* Make sure sidebar overlays content rather than pushing it */
        position: fixed;
      }
      
      .event-sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid var(--border-color);
      }
      
      .event-sidebar-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
      }
      
      .close-sidebar {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--text-color);
      }
      
      .event-form {
        padding: 16px;
      }
      
      .form-group {
        margin-bottom: 16px;
      }
      
      .event-form input[type="text"],
      .event-form input[type="date"],
      .event-form input[type="time"],
      .event-form textarea {
        width: 100%;
        padding: 8px 12px;
        background-color: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        color: var(--text-color);
        font-size: 14px;
      }
      
      .event-form textarea {
        min-height: 80px;
        resize: vertical;
      }
      
      .date-time-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .date-time-inputs {
        display: flex;
        gap: 8px;
      }
      
      .date-time-separator {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px 0;
        color: var(--text-muted);
      }
      
      .checkbox-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .color-options {
        display: flex;
        gap: 12px;
      }
      
      .color-option {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      
      .color-option:hover {
        transform: scale(1.1);
      }
      
      .color-option.blue {
        background-color: rgba(33, 150, 243, 0.8);
      }
      
      .color-option.green {
        background-color: rgba(76, 175, 80, 0.8);
      }
      
      .color-option.purple {
        background-color: rgba(156, 39, 176, 0.8);
      }
      
      .color-option.red {
        background-color: rgba(244, 67, 54, 0.8);
      }
      
      .color-option.selected {
        box-shadow: 0 0 0 2px white, 0 0 0 4px currentColor;
      }
      
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
      }
      
      .cancel-event, .save-event, .delete-event {
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
      }
      
      .cancel-event {
        background-color: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-color);
      }
      
      .save-event {
        background-color: var(--highlight-color);
        border: none;
        color: white;
      }
      
      .delete-event {
        background-color: #f44336;
        border: none;
        color: white;
        margin-right: auto;
      }
      
      /* Layout adjustment for sidebar and calendar */
      .calendar-container {
        margin-left: 0;
        transition: margin-left 0.3s ease;
        width: 100%;
        height: 100%;
        position: relative;
        transition: none;
      }
      
      /* Position calendar events properly within cells */
      .hour-cell, .all-day-cell {
        position: relative;
      }
    `;
    
    styleEl.textContent = customStyles;
    document.head.appendChild(styleEl);
    
    // Set up time indicator update and positioning
    if (currentView === 'day' || currentView === 'week') {
      updateTimeIndicator();
      
      // Update the time indicator every minute
      setTimeout(() => {
        renderCalendar(); // Re-render to update time
      }, 60000);
    }
    
    // Scroll to current time if it's day or week view
    if (currentView === 'day' || currentView === 'week') {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Calculate scroll position to show current time
      const timeColumn = document.querySelector('.time-column');
      if (timeColumn) {
        const hourCellHeight = 60; // Height of each hour cell
        const scrollPosition = currentHour * hourCellHeight - 100; // Position minus some offset to see above
        
        // Get the scrollable container
        const scrollContainer = document.querySelector('.day-grid') || document.querySelector('.week-grid');
        if (scrollContainer && scrollPosition > 0) {
          scrollContainer.scrollTop = scrollPosition;
        }
      }
    }
  }
  
  // Initialize dropdown menu for view selection
  function setupViewDropdown() {
    // Create main dropdown menu
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'view-dropdown-menu';
    dropdownMenu.style.display = 'none';
    dropdownMenu.style.position = 'absolute';
    dropdownMenu.style.backgroundColor = 'var(--sidebar-bg)';
    dropdownMenu.style.border = '1px solid var(--border-color)';
    dropdownMenu.style.borderRadius = '4px';
    dropdownMenu.style.zIndex = '100';
    dropdownMenu.style.width = '320px';
    dropdownMenu.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    
    // Create number of days submenu
    const daysSubmenu = document.createElement('div');
    daysSubmenu.className = 'days-submenu';
    daysSubmenu.style.display = 'none';
    daysSubmenu.style.position = 'absolute';
    daysSubmenu.style.backgroundColor = 'var(--sidebar-bg)';
    daysSubmenu.style.border = '1px solid var(--border-color)';
    daysSubmenu.style.borderRadius = '4px';
    daysSubmenu.style.zIndex = '100';
    daysSubmenu.style.width = '320px';
    daysSubmenu.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    
    // Create view settings submenu
    const settingsSubmenu = document.createElement('div');
    settingsSubmenu.className = 'settings-submenu';
    settingsSubmenu.style.display = 'none';
    settingsSubmenu.style.position = 'absolute';
    settingsSubmenu.style.backgroundColor = 'var(--sidebar-bg)';
    settingsSubmenu.style.border = '1px solid var(--border-color)';
    settingsSubmenu.style.borderRadius = '4px';
    settingsSubmenu.style.zIndex = '100';
    settingsSubmenu.style.width = '320px';
    settingsSubmenu.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    
    // Add view options
    const viewOptions = [
      { name: 'Day', shortcut: '1 or D' },
      { name: 'Week', shortcut: '0 or W' },
      { name: 'Month', shortcut: 'M' }
    ];
    
    viewOptions.forEach(view => {
      const option = document.createElement('div');
      option.style.display = 'flex';
      option.style.justifyContent = 'space-between';
      option.style.padding = '15px';
      option.style.cursor = 'pointer';
      option.style.color = 'var(--text-color)';
      option.style.borderBottom = '1px solid var(--border-color)';
      
      // Create check mark for the active view
      const checkMark = document.createElement('span');
      checkMark.textContent = view.name.toLowerCase() === currentView ? '✓' : '';
      checkMark.style.marginRight = '10px';
      
      const viewName = document.createElement('span');
      viewName.textContent = view.name;
      
      const shortcut = document.createElement('span');
      shortcut.textContent = view.shortcut;
      shortcut.style.color = 'var(--text-muted)';
      
      const leftSide = document.createElement('div');
      leftSide.style.display = 'flex';
      leftSide.style.alignItems = 'center';
      leftSide.appendChild(checkMark);
      leftSide.appendChild(viewName);
      
      option.appendChild(leftSide);
      option.appendChild(shortcut);
      
      option.addEventListener('mouseover', () => {
        option.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      });
      
      option.addEventListener('mouseout', () => {
        option.style.backgroundColor = '';
      });
      
      option.addEventListener('click', () => {
        currentView = view.name.toLowerCase();
        viewDropdown.textContent = `${view.name} ▾`;
        dropdownMenu.style.display = 'none';
        daysSubmenu.style.display = 'none';
        settingsSubmenu.style.display = 'none';
        renderCalendar();
        
        // Update checkmarks
        dropdownMenu.querySelectorAll('span').forEach(span => {
          if (span.textContent === '✓') span.textContent = '';
        });
        checkMark.textContent = '✓';
      });
      
      dropdownMenu.appendChild(option);
    });
    
    // Add number of days options
    const numberOfDaysOption = createMenuOption('Number of days', true);
    dropdownMenu.appendChild(numberOfDaysOption);
    
    // Add view settings option
    const viewSettingsOption = createMenuOption('View Settings', true);
    dropdownMenu.appendChild(viewSettingsOption);
    
    // Create number of days submenu options
    const dayOptions = [2, 3, 4, 5, 6, 7, 8, 9];
    dayOptions.forEach(days => {
      const option = createMenuOption(`${days} days`, false, `${days}`);
      daysSubmenu.appendChild(option);
      
      option.addEventListener('click', () => {
        // Set custom multi-day view
        currentView = 'custom';
        customDays = days;
        viewDropdown.textContent = `${days} Days ▾`;
        dropdownMenu.style.display = 'none';
        daysSubmenu.style.display = 'none';
        settingsSubmenu.style.display = 'none';
        renderCalendar();
      });
    });
    
    // Add "Other..." option to days submenu
    const otherOption = createMenuOption('Other...', false);
    daysSubmenu.appendChild(otherOption);
    
    otherOption.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Create a prompt dialog
      const promptContainer = document.createElement('div');
      promptContainer.style.position = 'fixed';
      promptContainer.style.top = '50%';
      promptContainer.style.left = '50%';
      promptContainer.style.transform = 'translate(-50%, -50%)';
      promptContainer.style.backgroundColor = 'var(--sidebar-bg)';
      promptContainer.style.border = '1px solid var(--border-color)';
      promptContainer.style.borderRadius = '4px';
      promptContainer.style.padding = '20px';
      promptContainer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
      promptContainer.style.zIndex = '200';
      promptContainer.style.minWidth = '300px';
      
      const promptTitle = document.createElement('h3');
      promptTitle.textContent = 'Number of days';
      promptTitle.style.marginBottom = '15px';
      promptTitle.style.color = 'var(--text-color)';
      
      const inputContainer = document.createElement('div');
      inputContainer.style.display = 'flex';
      inputContainer.style.marginBottom = '20px';
      
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.max = '31';
      input.value = customDays;
      input.style.flex = '1';
      input.style.padding = '8px';
      input.style.backgroundColor = 'var(--bg-color)';
      input.style.border = '1px solid var(--border-color)';
      input.style.borderRadius = '4px';
      input.style.color = 'var(--text-color)';
      
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'flex-end';
      buttonContainer.style.gap = '10px';
      
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.style.padding = '8px 15px';
      cancelButton.style.backgroundColor = 'var(--button-secondary)';
      cancelButton.style.border = '1px solid var(--border-color)';
      cancelButton.style.borderRadius = '4px';
      cancelButton.style.color = 'var(--text-color)';
      cancelButton.style.cursor = 'pointer';
      
      const okButton = document.createElement('button');
      okButton.textContent = 'OK';
      okButton.style.padding = '8px 15px';
      okButton.style.backgroundColor = 'var(--button-primary)';
      okButton.style.border = '1px solid var(--border-color)';
      okButton.style.borderRadius = '4px';
      okButton.style.color = 'var(--text-color)';
      okButton.style.cursor = 'pointer';
      
      // Add components to the container
      inputContainer.appendChild(input);
      buttonContainer.appendChild(cancelButton);
      buttonContainer.appendChild(okButton);
      
      promptContainer.appendChild(promptTitle);
      promptContainer.appendChild(inputContainer);
      promptContainer.appendChild(buttonContainer);
      
      // Add to document
      document.body.appendChild(promptContainer);
      
      // Focus the input
      input.focus();
      
      // Handle cancel button
      cancelButton.addEventListener('click', () => {
        document.body.removeChild(promptContainer);
      });
      
      // Handle OK button
      okButton.addEventListener('click', () => {
        const days = parseInt(input.value, 10);
        if (days && days > 0 && days <= 31) {
          customDays = days;
          currentView = 'custom';
          viewDropdown.textContent = `${days} Days ▾`;
          renderCalendar();
        }
        document.body.removeChild(promptContainer);
        dropdownMenu.style.display = 'none';
        daysSubmenu.style.display = 'none';
      });
      
      // Handle Enter key
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          okButton.click();
        } else if (e.key === 'Escape') {
          cancelButton.click();
        }
      });
    });
    
    // Create view settings submenu options
    const settingsOptions = [
      { name: 'Weekends', shortcut: 'shift ⌘ E', checked: showWeekends, setting: 'weekends' },
      { name: 'Declined events', shortcut: 'shift ⌘ D', checked: showDeclinedEvents, setting: 'declined' },
      { name: 'Week numbers', shortcut: '', checked: showWeekNumbers, setting: 'weekNumbers' }
    ];
    
    settingsOptions.forEach(setting => {
      const option = document.createElement('div');
      option.style.display = 'flex';
      option.style.justifyContent = 'space-between';
      option.style.padding = '15px';
      option.style.cursor = 'pointer';
      option.style.color = 'var(--text-color)';
      option.style.borderBottom = '1px solid var(--border-color)';
      
      // Create check mark for checked options
      const checkMark = document.createElement('span');
      checkMark.textContent = setting.checked ? '✓' : '';
      checkMark.style.marginRight = '10px';
      
      const settingName = document.createElement('span');
      settingName.textContent = setting.name;
      
      const shortcut = document.createElement('span');
      shortcut.textContent = setting.shortcut;
      shortcut.style.color = 'var(--text-muted)';
      
      const leftSide = document.createElement('div');
      leftSide.style.display = 'flex';
      leftSide.style.alignItems = 'center';
      leftSide.appendChild(checkMark);
      leftSide.appendChild(settingName);
      
      option.appendChild(leftSide);
      option.appendChild(shortcut);
      
      option.addEventListener('mouseover', () => {
        option.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      });
      
      option.addEventListener('mouseout', () => {
        option.style.backgroundColor = '';
      });
      
      option.addEventListener('click', (e) => {
        // Toggle setting state
        setting.checked = !setting.checked;
        checkMark.textContent = setting.checked ? '✓' : '';
        
        // Update global settings
        switch(setting.setting) {
          case 'weekends':
            showWeekends = setting.checked;
            break;
          case 'declined':
            showDeclinedEvents = setting.checked;
            break;
          case 'weekNumbers':
            showWeekNumbers = setting.checked;
            break;
        }
        
        // Re-render calendar with new settings
        renderCalendar();
        
        // Keep submenu open after toggling
        e.stopPropagation();
      });
      
      settingsSubmenu.appendChild(option);
    });
    
    // Add general settings option to settings submenu
    const generalSettingsOption = createMenuOption('General settings', false, '⌘ ,');
    settingsSubmenu.appendChild(generalSettingsOption);
    
    // Helper function to create menu options
    function createMenuOption(name, hasArrow, rightText = '') {
      const option = document.createElement('div');
      option.style.display = 'flex';
      option.style.justifyContent = 'space-between';
      option.style.padding = '15px';
      option.style.cursor = 'pointer';
      option.style.color = 'var(--text-color)';
      option.style.borderBottom = '1px solid var(--border-color)';
      
      const leftSide = document.createElement('div');
      leftSide.textContent = name;
      
      const rightSide = document.createElement('div');
      if (hasArrow) {
        rightSide.textContent = '>';
        rightSide.style.color = 'var(--text-muted)';
      } else if (rightText) {
        rightSide.textContent = rightText;
        rightSide.style.color = 'var(--text-muted)';
      }
      
      option.appendChild(leftSide);
      option.appendChild(rightSide);
      
      option.addEventListener('mouseover', () => {
        option.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      });
      
      option.addEventListener('mouseout', () => {
        option.style.backgroundColor = '';
      });
      
      return option;
    }
    
    // Number of days click event
    numberOfDaysOption.addEventListener('click', (e) => {
      e.stopPropagation();
      
      const rect = numberOfDaysOption.getBoundingClientRect();
      
      // Position submenu to the right of the main menu
      daysSubmenu.style.left = `${rect.right}px`;
      daysSubmenu.style.top = `${rect.top}px`;
      
      daysSubmenu.style.display = 'block';
    });
    
    // View settings click event
    viewSettingsOption.addEventListener('click', (e) => {
      e.stopPropagation();
      
      const rect = viewSettingsOption.getBoundingClientRect();
      
      // Position submenu to the right of the main menu
      settingsSubmenu.style.left = `${rect.right}px`;
      settingsSubmenu.style.top = `${rect.top}px`;
      
      settingsSubmenu.style.display = 'block';
    });
    
    // Insert dropdown menu
    document.body.appendChild(dropdownMenu);
    document.body.appendChild(daysSubmenu);
    document.body.appendChild(settingsSubmenu);
    
    // Position the dropdown under the button more precisely
    function positionDropdown() {
      const rect = viewDropdown.getBoundingClientRect();
      dropdownMenu.style.position = 'fixed';
      dropdownMenu.style.top = `${rect.bottom}px`;
      dropdownMenu.style.left = `${rect.left}px`;
    }
    
    // Toggle dropdown menu when button is clicked
    viewDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      
      const isVisible = dropdownMenu.style.display === 'block';
      
      // Hide all menus
      dropdownMenu.style.display = 'none';
      daysSubmenu.style.display = 'none';
      settingsSubmenu.style.display = 'none';
      
      // Show main dropdown if it was hidden
      if (!isVisible) {
        positionDropdown();
        dropdownMenu.style.display = 'block';
      }
    });
    
    // Close menus when clicking outside
    document.addEventListener('click', () => {
      dropdownMenu.style.display = 'none';
      daysSubmenu.style.display = 'none';
      settingsSubmenu.style.display = 'none';
    });
    
    // Add highlight to the active view in the dropdown
    function highlightActiveView() {
      const spans = dropdownMenu.querySelectorAll('span');
      spans.forEach(span => {
        if (span.textContent === '✓') {
          span.textContent = '';
        }
      });
      
      const optionTexts = Array.from(dropdownMenu.querySelectorAll('div > div:first-child > span:last-child')).map(el => el.textContent);
      const activeViewIndex = optionTexts.findIndex(text => text.toLowerCase() === currentView);
      
      if (activeViewIndex >= 0) {
        const checkMarks = dropdownMenu.querySelectorAll('div > div:first-child > span:first-child');
        if (checkMarks[activeViewIndex]) {
          checkMarks[activeViewIndex].textContent = '✓';
        }
      }
    }
    
    highlightActiveView();
  }
  
  // Event listeners for navigation buttons
  function setupNavigationButtons() {
    // Today button - reset to current date
    todayBtn.addEventListener('click', () => {
      currentDate = new Date();
      renderCalendar();
    });
    
    // Previous button - go back one unit based on current view
    prevBtn.addEventListener('click', () => {
      switch(currentView) {
        case 'day':
          currentDate.setDate(currentDate.getDate() - 1);
          break;
        case 'week':
          currentDate.setDate(currentDate.getDate() - 7);
          break;
        case 'custom':
          currentDate.setDate(currentDate.getDate() - customDays);
          break;
        case 'month':
        default:
          currentDate.setMonth(currentDate.getMonth() - 1);
          break;
      }
      renderCalendar();
    });
    
    // Next button - go forward one unit based on current view
    nextBtn.addEventListener('click', () => {
      switch(currentView) {
        case 'day':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'week':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'custom':
          currentDate.setDate(currentDate.getDate() + customDays);
          break;
        case 'month':
        default:
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
      renderCalendar();
    });
  }
  
  // Handle sidebar resizing
  function initSidebarResize() {
    if (!sidebarResizeHandle || !sidebar) return;
    
    // Mouse down on the resize handle
    sidebarResizeHandle.addEventListener('mousedown', (e) => {
      isSidebarResizing = true;
      resizeStartX = e.clientX;
      sidebarInitialWidth = sidebar.offsetWidth;
      
      // Add resizing class to prevent text selection and show visual feedback
      document.body.classList.add('sidebar-resizing');
      sidebarResizeHandle.classList.add('active');
      
      // Store current width for calculations
      sidebar.style.width = `${sidebarInitialWidth}px`;
      
      // Prevent default behavior and text selection
      e.preventDefault();
    });
    
    // Track mouse movement for resizing
    document.addEventListener('mousemove', (e) => {
      if (!isSidebarResizing) return;
      
      const newWidth = sidebarInitialWidth + (e.clientX - resizeStartX);
      
      // Apply min/max constraints
      const minWidth = parseInt(getComputedStyle(sidebar).minWidth) || 180;
      const maxWidth = parseInt(getComputedStyle(sidebar).maxWidth) || 600;
      
      const constrainedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
      
      // Apply new width
      sidebar.style.width = `${constrainedWidth}px`;
    });
    
    // Stop resizing on mouse up (anywhere in the document)
    document.addEventListener('mouseup', () => {
      if (isSidebarResizing) {
        isSidebarResizing = false;
        document.body.classList.remove('sidebar-resizing');
        sidebarResizeHandle.classList.remove('active');
        
        // Save the sidebar width to localStorage for persistence
        try {
          localStorage.setItem('sidebarWidth', sidebar.style.width);
        } catch (e) {
          console.error('Error saving sidebar width:', e);
        }
      }
    });
    
    // Restore saved sidebar width
    try {
      const savedWidth = localStorage.getItem('sidebarWidth');
      if (savedWidth) {
        sidebar.style.width = savedWidth;
      }
    } catch (e) {
      console.error('Error loading sidebar width:', e);
    }
  }

  // Initialize calendar functionality
  function initCalendar() {
    // Load saved events
    loadEvents();
    
    setupViewDropdown();
    setupNavigationButtons();
    
    // Initialize sidebar resize functionality
    initSidebarResize();
    
    // Set initial state
    updateCalendarHeader();
    
    // Render initial calendar
    renderCalendar();
  }
  
  // Start the calendar
  initCalendar();
}); 