const people = window.birthdays || [];

const list = document.getElementById('birthday-list');
const todayLabel = document.getElementById('today-label');

function formatDate(date) {
  return date.toLocaleDateString('en', {
    month: 'short',
    day: 'numeric'
  });
}

function getNextBirthday(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(today.getFullYear(), month - 1, day);

  if (target < today) {
    target.setFullYear(today.getFullYear() + 1);
  }

  return target;
}

function getDaysUntil(targetDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(targetDate);
  next.setHours(0, 0, 0, 0);
  const diff = Math.round((next - today) / (1000 * 60 * 60 * 24));
  return diff;
}

function renderBirthdays() {
  const upcoming = people
    .map((person) => {
      const birthdayValue = person.date || person.birthday;
      const nextBirthday = getNextBirthday(birthdayValue);
      const daysLeft = getDaysUntil(nextBirthday);
      return {
        ...person,
        nextBirthday,
        daysLeft
      };
    })
    .filter((person) => person.daysLeft <= 7 && person.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  todayLabel.textContent = new Date().toLocaleDateString('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  if (!upcoming.length) {
    list.innerHTML = '<div class="empty-state">No birthdays are coming up in the next 7 days.</div>';
    return;
  }

  list.innerHTML = upcoming
    .map((person) => {
      let dayText;
      if (person.daysLeft === 0) {
        dayText = 'Today';
      } else if (person.daysLeft === 1) {
        dayText = 'Tomorrow';
      } else if (person.daysLeft === 7) {
        dayText = 'Next week';
      } else {
        dayText = `${person.daysLeft} days`;
      }

      const todayClass = person.daysLeft === 0 ? ' is-today' : '';

      return `
        <article class="birthday-item${todayClass}">
          <div class="person-info">
            <strong>${person.name}</strong>
            <span>${formatDate(person.nextBirthday)}</span>
          </div>
          <div class="countdown-badge${todayClass}">${dayText}</div>
        </article>
      `;
    })
    .join('');
}

// Run original setup engine
renderBirthdays();

// =====================================================================
// BAR GRAPH RENDERING
// =====================================================================
function renderBarGraph() {
  const barGraph = document.getElementById('bar-graph');
  if (!barGraph) return;

  // Initialize month counts
  const monthCounts = new Array(12).fill(0);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Count birthdays per month
  people.forEach((person) => {
    const birthdayValue = person.date || person.birthday;
    const [year, month, day] = birthdayValue.split('-').map(Number);
    monthCounts[month - 1]++;
  });

  // Find max count for scaling
  const maxCount = Math.max(...monthCounts, 1);

  // Render bar graph
  barGraph.innerHTML = monthCounts
    .map((count, index) => {
      const percentage = (count / maxCount) * 100;
      return `
        <div class="bar-row">
          <div class="bar-label">${months[index]}</div>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${percentage}%"></div>
            <div class="bar-count">${count}</div>
          </div>
        </div>
      `;
    })
    .join('');
}

// Render bar graph if on index page
if (document.getElementById('bar-graph')) {
  renderBarGraph();
}

// =====================================================================
// DASHBOARD STATISTICS
// =====================================================================
function renderStats() {
  const totalEl = document.getElementById('stat-total');
  if (!totalEl) return;

  const monthEl = document.getElementById('stat-month');
  const monthHintEl = document.getElementById('stat-month-hint');
  const nextDaysEl = document.getElementById('stat-next-days');
  const nextNameEl = document.getElementById('stat-next-name');

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const currentMonthIndex = new Date().getMonth();

  totalEl.textContent = people.length;

  const thisMonthCount = people.filter((person) => {
    const birthdayValue = person.date || person.birthday;
    const month = Number(birthdayValue.split('-')[1]);
    return month === currentMonthIndex + 1;
  }).length;
  monthEl.textContent = thisMonthCount;
  monthHintEl.textContent = `in ${monthNames[currentMonthIndex]}`;

  const ranked = people
    .map((person) => {
      const birthdayValue = person.date || person.birthday;
      return { name: person.name, daysLeft: getDaysUntil(getNextBirthday(birthdayValue)) };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (ranked.length) {
    const soonest = ranked[0];
    nextDaysEl.textContent = soonest.daysLeft === 0 ? 'Today' : `${soonest.daysLeft}d`;
    nextNameEl.textContent = soonest.name;
  }
}

if (document.getElementById('stat-total')) {
  renderStats();
}

// =====================================================================
// CALENDAR RENDERING
// =====================================================================
function renderCalendar() {
  const calendarDays = document.getElementById('calendar-days');
  const calendarMonth = document.getElementById('calendar-month');
  const calendarYear = document.getElementById('calendar-year');
  
  if (!calendarDays) return;

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Set month and year display
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  calendarMonth.textContent = monthNames[currentMonth];
  calendarYear.textContent = currentYear;

  // Get first day of month and total days
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Get birthdays for this month
  const birthdaysThisMonth = new Set();
  people.forEach((person) => {
    const birthdayValue = person.date || person.birthday;
    const [year, month, day] = birthdayValue.split('-').map(Number);
    if (month === currentMonth + 1) {
      birthdaysThisMonth.add(day);
    }
  });

  // Generate calendar days
  let html = '';
  
  // Empty cells for days before first day of month
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="calendar-day empty"></div>';
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today.getDate();
    const hasBirthday = birthdaysThisMonth.has(day);
    const classes = ['calendar-day'];
    
    if (isToday) classes.push('today');
    if (hasBirthday) classes.push('has-birthday');
    
    html += `<div class="${classes.join(' ')}">${day}</div>`;
  }

  calendarDays.innerHTML = html;
}

// Render calendar if on calendar page - moved to DOMContentLoaded

// =====================================================================
// MINECRAFT AUDIO INTERACTION LAYER (Safe Global Event Delegation)
// =====================================================================
document.addEventListener("DOMContentLoaded", () => {
  const clickSound = document.getElementById("mc-click-sound");
  let audioUnlocked = false;

  const unlockAudio = () => {
    if (!audioUnlocked && clickSound) {
      clickSound.play().then(() => {
        clickSound.pause();
        clickSound.currentTime = 0;
        audioUnlocked = true;
      }).catch(() => {
        // Audio unlock failed, will try again on next click
      });
    }
  };

  const playMcClick = () => {
    if (!clickSound) return;

    // Try to unlock audio on first interaction
    unlockAudio();

    // Clone the node so rapid multiple clicks can stack sound seamlessly
    const soundClone = clickSound.cloneNode();
    soundClone.volume = 0.4; // Balance volume audio mix

    const playPromise = soundClone.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log("Audio play error:", error);
      });
    }
  };

  // Uses top-level body delegation to dynamically intercept clicks on items
  // rendered inside your template mapping structure after the site loads.
  document.body.addEventListener("click", (event) => {
    const target = event.target;
    
    // Play sound on all interactive elements
    if (target.closest("button") || 
        target.closest("a") || 
        target.closest("input") || 
        target.closest("textarea") ||
        target.closest(".mc-btn") || 
        target.closest(".birthday-item") || 
        target.closest(".nav-item") || 
        target.closest(".calendar-day") || 
        target.closest(".mc-input") || 
        target.closest(".submit-btn")) {
      playMcClick();
    }
  });

  // Render calendar if on calendar page
  if (document.getElementById('calendar-days')) {
    renderCalendar();
  }

  // Feedback form: acknowledge submission (mailto still handles the send)
  const adviceForm = document.getElementById('advice-form');
  const formHint = document.getElementById('form-hint');
  if (adviceForm && formHint) {
    adviceForm.addEventListener('submit', () => {
      formHint.textContent = 'Opening your email app…';
      formHint.classList.add('is-success');
    });
  }

  // Page Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      
      // Hide all pages (display is fully controlled by the .page-content /
      // .active CSS classes, so no inline styles fight them here)
      document.querySelectorAll('.page-content').forEach(p => {
        p.classList.remove('active');
      });
      
      // Show selected page
      const selectedPage = document.getElementById(`page-${page}`);
      if (selectedPage) {
        selectedPage.classList.add('active');
      }
      
      // Update nav active state
      document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
      });
      item.classList.add('active');
    });
  });
});
