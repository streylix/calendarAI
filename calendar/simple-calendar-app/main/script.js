document.addEventListener('DOMContentLoaded', () => {
  // Calendar state
  let currentDate = new Date();
  let currentView = 'month';
  let customDays = 3; // Default number of days for custom view
  let showWeekends = true;
  let showDeclinedEvents = true;
  let showWeekNumbers = false;
  
  // DOM elements
  const viewDropdown = document.querySelector('.view-dropdown');
  const todayBtn = document.querySelector('.today-btn');
  const prevBtn = document.querySelector('.nav-icons .icon-btn:first-child');
  const nextBtn = document.querySelector('.nav-icons .icon-btn:last-child');
  const monthHeader = document.querySelector('.month-header');
  const calendarContainer = document.querySelector('.calendar-container');
  
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
    const day = currentDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
    startOfWeek.setDate(currentDate.getDate() - day);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }
    
    // Get the current real date for highlighting today
    const today = new Date();
    const isCurrentWeek = weekDays.some(date => 
      date.getDate() === today.getDate() && 
      date.getMonth() === today.getMonth() && 
      date.getFullYear() === today.getFullYear()
    );
    
    let html = `
      <div class="week-view">
        <div class="week-header">
          <div class="time-column">EDT</div>
    `;
    
    // Add column headers with dates
    weekDays.forEach(date => {
      const isToday = date.getDate() === today.getDate() && 
                       date.getMonth() === today.getMonth() && 
                       date.getFullYear() === today.getFullYear();
      
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      const dayOfMonth = date.getDate();
      
      html += `
        <div class="day-column-header${isToday ? ' today-column' : ''}">
          ${dayOfWeek} ${dayOfMonth}${isToday ? ' <span class="today-marker">12</span>' : ''}
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
    for (let hour = 4; hour <= 11; hour++) {
      html += `<div class="time-slot">${hour} PM</div>`;
    }
    
    html += `
          </div>
    `;
    
    // Add columns for each day
    weekDays.forEach((date, dayIndex) => {
      const isToday = date.getDate() === today.getDate() && 
                       date.getMonth() === today.getMonth() && 
                       date.getFullYear() === today.getFullYear();
      
      html += `
        <div class="day-column${isToday ? ' today-column' : ''}">
          <div class="all-day-cell">
            ${dayIndex === 0 && date.getDate() === 11 ? '<div class="week-event">Moth...</div>' : ''}
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
  
  // Generate day view calendar
  function generateDayView() {
    // Get the current real date for highlighting today
    const today = new Date();
    const isToday = today.getDate() === currentDate.getDate() && 
                     today.getMonth() === currentDate.getMonth() && 
                     today.getFullYear() === currentDate.getFullYear();
    
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDate.getDay()];
    const dayOfMonth = currentDate.getDate();
    
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
    
    // Add time rows
    for (let hour = 4; hour <= 11; hour++) {
      html += `<div class="time-slot">${hour} PM</div>`;
    }
    
    html += `
          </div>
          <div class="day-column${isToday ? ' today-column' : ''}">
            <div class="all-day-cell"></div>
    `;
    
    // Add cells for each hour
    for (let hour = 4; hour <= 11; hour++) {
      html += `
        <div class="hour-cell">
          ${hour === 9 && isToday ? '<div class="time-indicator">9:10 PM</div>' : ''}
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
    `;
    
    styleEl.textContent = customStyles;
    document.head.appendChild(styleEl);
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
  
  // Initialize calendar functionality
  function initCalendar() {
    setupViewDropdown();
    setupNavigationButtons();
    
    // Set initial state
    updateCalendarHeader();
    
    // Render initial calendar
    renderCalendar();
  }
  
  // Start the calendar
  initCalendar();
}); 