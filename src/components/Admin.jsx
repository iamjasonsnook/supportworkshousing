import { useState, useEffect, useMemo } from 'react';
import { Shield, Calendar, Users, MapPin, Phone, Mail, Check, X, Clock, LogOut, RefreshCw, Filter, ChevronLeft, ChevronRight, Building, User, FileText, ArrowLeft, Edit3, Save, Search } from 'lucide-react';
import './Admin.css';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [calendarView, setCalendarView] = useState('month'); // 'week' or 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Volunteer management state
  const [activeTab, setActiveTab] = useState('events'); // 'events' or 'volunteers'
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [volunteerDetail, setVolunteerDetail] = useState(null);
  const [volunteerFilter, setVolunteerFilter] = useState('all'); // 'all', 'organization', 'individual'
  const [volunteerSearch, setVolunteerSearch] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', organization: '' });
  const [statsTimeframe, setStatsTimeframe] = useState('all'); // 'all', 'year', 'quarter', 'month'
  const [stats, setStats] = useState(null);

  // Check for existing session
  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (session) {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch events and volunteers when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
      fetchVolunteers();
      fetchStats();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('admin_session', data.token);
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    setIsAuthenticated(false);
    setEvents([]);
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_session');
      const response = await fetch(`${API_BASE}/api/admin/events`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();
      if (data.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const token = localStorage.getItem('admin_session');
      const response = await fetch(`${API_BASE}/api/admin/volunteers`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();
      if (data.volunteers) {
        setVolunteers(data.volunteers);
      }
    } catch (err) {
      console.error('Failed to fetch volunteers:', err);
    }
  };

  const fetchVolunteerDetail = async (volunteerId) => {
    try {
      const token = localStorage.getItem('admin_session');
      const response = await fetch(`${API_BASE}/api/admin/volunteers/${volunteerId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();
      if (data.volunteer) {
        setVolunteerDetail(data.volunteer);
        setNotesText(data.volunteer.notes || '');
        setProfileForm({
          name: data.volunteer.name || '',
          email: data.volunteer.email || '',
          phone: data.volunteer.phone || '',
          organization: data.volunteer.organization || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch volunteer detail:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_session');
      const response = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const saveVolunteerNotes = async () => {
    if (!volunteerDetail) return;

    try {
      const token = localStorage.getItem('admin_session');
      const response = await fetch(`${API_BASE}/api/admin/volunteers/${volunteerDetail.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: notesText }),
      });

      if (response.ok) {
        setVolunteerDetail({ ...volunteerDetail, notes: notesText });
        setEditingNotes(false);
        fetchVolunteers(); // Refresh the list
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
    }
  };

  const handleViewVolunteer = (volunteerId) => {
    setSelectedVolunteer(volunteerId);
    fetchVolunteerDetail(volunteerId);
    setActiveTab('volunteers');
  };

  const handleBackToVolunteerList = () => {
    setSelectedVolunteer(null);
    setVolunteerDetail(null);
    setEditingNotes(false);
    setEditingProfile(false);
  };

  const saveVolunteerProfile = async () => {
    if (!volunteerDetail) return;

    try {
      const token = localStorage.getItem('admin_session');
      const response = await fetch(`${API_BASE}/api/admin/volunteers/${volunteerDetail.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        setVolunteerDetail({ ...volunteerDetail, ...profileForm });
        setEditingProfile(false);
        fetchVolunteers(); // Refresh the list
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  const handleViewEventFromVolunteer = (eventId) => {
    setActiveTab('events');
    setSelectedVolunteer(null);
    setVolunteerDetail(null);
    // Scroll to the event card
    setTimeout(() => {
      const eventCard = document.getElementById(`event-${eventId}`);
      if (eventCard) {
        eventCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        eventCard.classList.add('highlight');
        setTimeout(() => eventCard.classList.remove('highlight'), 2000);
      }
    }, 100);
  };

  const getVolunteerForEvent = (event) => {
    return volunteers.find(v => v.id === event.volunteer_id);
  };

  const handleApprove = async (event) => {
    if (!confirm(`Approve Connection Night for ${event.group_name}?`)) return;

    setActionLoading(event.id);
    try {
      const token = localStorage.getItem('admin_session');
      const response = await fetch(`${API_BASE}/api/admin/events/${event.id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        fetchEvents();
      }
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (event) => {
    const reason = prompt(`Deny Connection Night for ${event.group_name}?\n\nEnter a reason (optional):`);
    if (reason === null) return;

    setActionLoading(event.id);
    try {
      const token = localStorage.getItem('admin_session');
      const response = await fetch(`${API_BASE}/api/admin/events/${event.id}/deny`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        fetchEvents();
      }
    } catch (err) {
      console.error('Deny failed:', err);
    } finally {
      setActionLoading(null);
    }
  };


  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-pending', icon: Clock, label: 'Pending' },
      approved: { class: 'badge-approved', icon: Check, label: 'Approved' },
      denied: { class: 'badge-denied', icon: X, label: 'Denied' },
      completed: { class: 'badge-completed', icon: Check, label: 'Completed' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`status-badge ${badge.class}`}>
        <badge.icon size={14} />
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Calendar helpers
  const parseEventDate = (event) => {
    // Parse "Tuesday, February 11" format
    const dayStr = event.time_slot_day;
    if (!dayStr) return null;

    const match = dayStr.match(/(\w+),\s*(\w+)\s*(\d+)/);
    if (!match) return null;

    const [, , month, day] = match;
    const monthIndex = new Date(`${month} 1, 2000`).getMonth();

    // Determine year from event's created_at or completed_at
    let year = currentDate.getFullYear();
    if (event.created_at) {
      const createdDate = new Date(event.created_at);
      year = createdDate.getFullYear();
      // If the event month is before the created month, it's likely next year
      if (monthIndex < createdDate.getMonth()) {
        year = year + 1;
      }
    }
    if (event.completed_at) {
      // Use completed_at year for completed events
      year = new Date(event.completed_at).getFullYear();
    }

    return new Date(year, monthIndex, parseInt(day));
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = parseEventDate(event);
      if (!eventDate) return false;
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (calendarView === 'month') {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startPadding = firstDay.getDay();
      const days = [];

      // Previous month padding
      for (let i = startPadding - 1; i >= 0; i--) {
        const d = new Date(year, month, -i);
        days.push({ date: d, isCurrentMonth: false });
      }

      // Current month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push({ date: new Date(year, month, i), isCurrentMonth: true });
      }

      // Next month padding
      const remaining = 42 - days.length;
      for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
      }

      return days;
    } else {
      // Week view
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        days.push({ date: d, isCurrentMonth: d.getMonth() === month });
      }
      return days;
    }
  }, [currentDate, calendarView]);

  const navigateCalendar = (direction) => {
    const newDate = new Date(currentDate);
    if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setDate(newDate.getDate() + (direction * 7));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  const handleDateClick = (date) => {
    const eventsOnDate = getEventsForDate(date);
    if (eventsOnDate.length > 0) {
      setSelectedDate(date);
      setFilter('all');
    }
  };

  // Filter events based on selected date or filter
  const displayedEvents = useMemo(() => {
    let filtered = events;

    if (selectedDate) {
      filtered = getEventsForDate(selectedDate);
    } else if (filter !== 'all') {
      filtered = events.filter(e => e.status === filter);
    }

    return filtered;
  }, [events, filter, selectedDate]);

  // Calculate stats based on timeframe
  const calculatedStats = useMemo(() => {
    if (!events.length) return null;

    const now = new Date();
    let startDate = null;

    if (statsTimeframe === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (statsTimeframe === 'quarter') {
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStart, 1);
    } else if (statsTimeframe === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const filteredEvents = startDate
      ? events.filter(e => {
          const eventDate = e.completed_at ? new Date(e.completed_at) : new Date(e.created_at);
          return eventDate >= startDate;
        })
      : events;

    const completedEvents = filteredEvents.filter(e => e.status === 'completed').length;
    const pendingEvents = filteredEvents.filter(e => e.status === 'pending').length;
    const totalVolunteerHours = filteredEvents
      .filter(e => e.status === 'completed')
      .reduce((sum, e) => sum + (e.group_size * 2), 0);

    // Count unique volunteers in the timeframe
    const uniqueVolunteerIds = new Set(filteredEvents.map(e => e.volunteer_id));

    return {
      totalVolunteers: statsTimeframe === 'all' ? volunteers.length : uniqueVolunteerIds.size,
      completedEvents,
      pendingEvents,
      totalVolunteerHours,
    };
  }, [events, volunteers, statsTimeframe]);

  // Filter volunteers based on type and search query
  const displayedVolunteers = useMemo(() => {
    let filtered = volunteers;

    // Filter by type
    if (volunteerFilter !== 'all') {
      filtered = filtered.filter(v => v.type === volunteerFilter);
    }

    // Filter by search query
    if (volunteerSearch.trim()) {
      const query = volunteerSearch.toLowerCase();
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(query) ||
        (v.organization && v.organization.toLowerCase().includes(query)) ||
        v.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [volunteers, volunteerFilter, volunteerSearch]);

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <Shield size={48} color="#9B1B5D" />
            <h1>Admin Dashboard</h1>
            <p>SupportWorks Housing</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="admin-form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
              />
            </div>
            {error && <div className="admin-error">{error}</div>}
            <button type="submit" className="admin-btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-left">
          <Shield size={32} color="#9B1B5D" />
          <div>
            <h1>Admin Dashboard</h1>
            <p>SupportWorks Housing</p>
          </div>
        </div>
        <div className="admin-header-right">
          <button onClick={() => { fetchEvents(); fetchVolunteers(); fetchStats(); }} className="admin-btn-icon" title="Refresh">
            <RefreshCw size={20} className={loading ? 'spinning' : ''} />
          </button>
          <button onClick={handleLogout} className="admin-btn-icon" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      {calculatedStats && (
        <div className="admin-stats-bar">
          <div className="stats-timeframe">
            <select
              value={statsTimeframe}
              onChange={(e) => setStatsTimeframe(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="year">This Year</option>
              <option value="quarter">This Quarter</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div className="stats-metrics">
            <div className="stat-item">
              <span className="stat-value">{calculatedStats.totalVolunteers}</span>
              <span className="stat-label">Volunteers</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{calculatedStats.completedEvents}</span>
              <span className="stat-label">Events<br />Completed</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{calculatedStats.pendingEvents}</span>
              <span className="stat-label">Events<br />Pending</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{calculatedStats.totalVolunteerHours}</span>
              <span className="stat-label">Volunteer<br />Hours</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => { setActiveTab('events'); setSelectedVolunteer(null); }}
        >
          <Calendar size={18} />
          Events
        </button>
        <button
          className={`admin-tab ${activeTab === 'volunteers' ? 'active' : ''}`}
          onClick={() => { setActiveTab('volunteers'); setSelectedVolunteer(null); setVolunteerDetail(null); }}
        >
          <Users size={18} />
          Volunteers
        </button>
      </div>

      <div className="admin-content">
        {/* Events Tab */}
        {activeTab === 'events' && (
          <>
        {/* Calendar Visualization */}
        <div className="calendar-section">
          <div className="calendar-header">
            <div className="calendar-nav">
              <button onClick={() => navigateCalendar(-1)} className="calendar-nav-btn">
                <ChevronLeft size={20} />
              </button>
              <h2>
                {currentDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                  ...(calendarView === 'week' && { day: 'numeric' })
                })}
              </h2>
              <button onClick={() => navigateCalendar(1)} className="calendar-nav-btn">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="calendar-controls">
              <button onClick={goToToday} className="calendar-today-btn">Today</button>
              <div className="calendar-view-toggle">
                <button
                  className={calendarView === 'week' ? 'active' : ''}
                  onClick={() => setCalendarView('week')}
                >
                  Week
                </button>
                <button
                  className={calendarView === 'month' ? 'active' : ''}
                  onClick={() => setCalendarView('month')}
                >
                  Month
                </button>
              </div>
            </div>
          </div>

          <div className="calendar-grid">
            <div className="calendar-weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-weekday">{day}</div>
              ))}
            </div>
            <div className={`calendar-days ${calendarView}`}>
              {getCalendarDays.map(({ date, isCurrentMonth }, idx) => {
                const dayEvents = getEventsForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                const pendingCount = dayEvents.filter(e => e.status === 'pending').length;
                const approvedCount = dayEvents.filter(e => e.status === 'approved').length;
                const deniedCount = dayEvents.filter(e => e.status === 'denied').length;
                const completedCount = dayEvents.filter(e => e.status === 'completed').length;

                return (
                  <div
                    key={idx}
                    className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
                    onClick={() => handleDateClick(date)}
                  >
                    <span className="day-number">{date.getDate()}</span>
                    {dayEvents.length > 0 && (
                      <div className="day-events">
                        {pendingCount > 0 && <span className="event-dot pending" title={`${pendingCount} pending`}>{pendingCount}</span>}
                        {approvedCount > 0 && <span className="event-dot approved" title={`${approvedCount} approved`}>{approvedCount}</span>}
                        {completedCount > 0 && <span className="event-dot completed" title={`${completedCount} completed`}>{completedCount}</span>}
                        {deniedCount > 0 && <span className="event-dot denied" title={`${deniedCount} denied`}>{deniedCount}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="calendar-legend">
            <span className="legend-item"><span className="legend-dot pending"></span> Pending</span>
            <span className="legend-item"><span className="legend-dot approved"></span> Approved</span>
            <span className="legend-item"><span className="legend-dot completed"></span> Completed</span>
            <span className="legend-item"><span className="legend-dot denied"></span> Denied</span>
          </div>
        </div>

        <div className="admin-toolbar">
          <div className="admin-filters">
            <Filter size={18} />
            {selectedDate && (
              <button
                className="filter-btn active"
                onClick={() => setSelectedDate(null)}
              >
                {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ✕
              </button>
            )}
            <button
              className={`filter-btn ${filter === 'all' && !selectedDate ? 'active' : ''}`}
              onClick={() => { setFilter('all'); setSelectedDate(null); }}
            >
              All ({events.length})
            </button>
            <button
              className={`filter-btn ${filter === 'pending' && !selectedDate ? 'active' : ''}`}
              onClick={() => { setFilter('pending'); setSelectedDate(null); }}
            >
              Pending ({events.filter(e => e.status === 'pending').length})
            </button>
            <button
              className={`filter-btn ${filter === 'approved' && !selectedDate ? 'active' : ''}`}
              onClick={() => { setFilter('approved'); setSelectedDate(null); }}
            >
              Approved ({events.filter(e => e.status === 'approved').length})
            </button>
            <button
              className={`filter-btn ${filter === 'completed' && !selectedDate ? 'active' : ''}`}
              onClick={() => { setFilter('completed'); setSelectedDate(null); }}
            >
              Completed ({events.filter(e => e.status === 'completed').length})
            </button>
            <button
              className={`filter-btn ${filter === 'denied' && !selectedDate ? 'active' : ''}`}
              onClick={() => { setFilter('denied'); setSelectedDate(null); }}
            >
              Denied ({events.filter(e => e.status === 'denied').length})
            </button>
          </div>
        </div>

        {loading && events.length === 0 ? (
          <div className="admin-loading">Loading events...</div>
        ) : displayedEvents.length === 0 ? (
          <div className="admin-empty">
            <Calendar size={48} />
            <p>No {filter !== 'all' ? filter : ''} events found</p>
          </div>
        ) : (
          <div className="admin-events">
            {displayedEvents.map((event) => {
              const volunteer = getVolunteerForEvent(event);
              return (
              <div key={event.id} id={`event-${event.id}`} className="event-card">
                <div className="event-header">
                  <div className="event-title">
                    <h3>{event.group_name}</h3>
                    {getStatusBadge(event.status)}
                  </div>
                  <span className="event-date">Submitted {formatDate(event.created_at)}</span>
                </div>

                <div className="event-details">
                  <div className="event-detail">
                    <Calendar size={16} />
                    <span>{event.time_slot_day}, {event.time_slot_time}</span>
                  </div>
                  <div className="event-detail">
                    <MapPin size={16} />
                    <span>{event.location_name}</span>
                  </div>
                  <div className="event-detail">
                    <Users size={16} />
                    <span>{event.group_size} people</span>
                  </div>
                  <div className="event-detail">
                    <Mail size={16} />
                    <a href={`mailto:${event.contact_email}`}>{event.contact_email}</a>
                  </div>
                  <div className="event-detail">
                    <Phone size={16} />
                    <a href={`tel:${event.contact_phone}`}>{event.contact_phone}</a>
                  </div>
                </div>

                <div className="event-info">
                  <div className="info-item">
                    <strong>Contact:</strong> {event.contact_name}
                  </div>
                  <div className="info-item">
                    <strong>Food Plan:</strong> {event.food_plan === 'bring' ? 'Bringing food' : 'Catering'}
                  </div>
                  <div className="info-item">
                    <strong>Activity:</strong> {event.activity_plan}
                  </div>
                </div>

                {/* Volunteer Link */}
                {volunteer && (
                  <div className="event-volunteer-link">
                    <button
                      className="volunteer-link-btn"
                      onClick={() => handleViewVolunteer(volunteer.id)}
                    >
                      {volunteer.type === 'organization' ? <Building size={16} /> : <User size={16} />}
                      <span>View {volunteer.type === 'organization' ? volunteer.organization : volunteer.name}</span>
                      <span className="volunteer-event-count">{volunteer.completed_events} past events</span>
                    </button>
                  </div>
                )}

                {event.status === 'pending' && (
                  <div className="event-actions">
                    <button
                      className="admin-btn-approve"
                      onClick={() => handleApprove(event)}
                      disabled={actionLoading === event.id}
                    >
                      <Check size={18} />
                      Approve
                    </button>
                    <button
                      className="admin-btn-deny"
                      onClick={() => handleDeny(event)}
                      disabled={actionLoading === event.id}
                    >
                      <X size={18} />
                      Deny
                    </button>
                  </div>
                )}

                {event.status === 'denied' && event.denial_reason && (
                  <div className="event-denial-reason">
                    <strong>Denial reason:</strong> {event.denial_reason}
                  </div>
                )}
              </div>
            );
            })}
          </div>
        )}
          </>
        )}

        {/* Volunteers Tab */}
        {activeTab === 'volunteers' && !selectedVolunteer && (
          <>
            <div className="admin-toolbar volunteer-toolbar">
              <div className="admin-filters">
                <Filter size={18} />
                <button
                  className={`filter-btn ${volunteerFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setVolunteerFilter('all')}
                >
                  All ({volunteers.length})
                </button>
                <button
                  className={`filter-btn ${volunteerFilter === 'organization' ? 'active' : ''}`}
                  onClick={() => setVolunteerFilter('organization')}
                >
                  <Building size={14} />
                  Organizations ({volunteers.filter(v => v.type === 'organization').length})
                </button>
                <button
                  className={`filter-btn ${volunteerFilter === 'individual' ? 'active' : ''}`}
                  onClick={() => setVolunteerFilter('individual')}
                >
                  <User size={14} />
                  Individuals ({volunteers.filter(v => v.type === 'individual').length})
                </button>
              </div>
              <div className="volunteer-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search volunteers..."
                  value={volunteerSearch}
                  onChange={(e) => setVolunteerSearch(e.target.value)}
                />
                {volunteerSearch && (
                  <button
                    className="search-clear"
                    onClick={() => setVolunteerSearch('')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="volunteer-list">
              {displayedVolunteers.map(volunteer => (
                <div
                  key={volunteer.id}
                  className="volunteer-card"
                  onClick={() => handleViewVolunteer(volunteer.id)}
                >
                  <div className="volunteer-card-header">
                    <div className="volunteer-avatar">
                      {volunteer.type === 'organization' ? <Building size={24} /> : <User size={24} />}
                    </div>
                    <div className="volunteer-info">
                      <h3>{volunteer.type === 'organization' ? volunteer.organization : volunteer.name}</h3>
                      {volunteer.type === 'organization' && (
                        <p className="volunteer-contact">{volunteer.name}</p>
                      )}
                    </div>
                    <div className="volunteer-stats">
                      <div className="volunteer-stat">
                        <span className="stat-number">{volunteer.completed_events || 0}</span>
                        <span className="stat-label">Completed</span>
                      </div>
                      <div className="volunteer-stat">
                        <span className="stat-number">{volunteer.upcoming_events || 0}</span>
                        <span className="stat-label">Upcoming</span>
                      </div>
                    </div>
                  </div>
                  <div className="volunteer-card-footer">
                    <span className="volunteer-email">
                      <Mail size={14} />
                      {volunteer.email}
                    </span>
                    {volunteer.last_event && (
                      <span className="volunteer-last-event">
                        Last: {volunteer.last_event.time_slot_day}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Volunteer Detail View */}
        {activeTab === 'volunteers' && selectedVolunteer && volunteerDetail && (
          <div className="volunteer-detail">
            <button className="back-btn" onClick={handleBackToVolunteerList}>
              <ArrowLeft size={18} />
              Back to Volunteers
            </button>

            <div className="volunteer-detail-header">
              <div className="volunteer-detail-avatar">
                {volunteerDetail.type === 'organization' ? <Building size={40} /> : <User size={40} />}
              </div>
              <div className="volunteer-detail-info">
                {editingProfile ? (
                  <div className="profile-edit-form">
                    {volunteerDetail.type === 'organization' && (
                      <div className="profile-field">
                        <label>Organization</label>
                        <input
                          type="text"
                          value={profileForm.organization}
                          onChange={(e) => setProfileForm({ ...profileForm, organization: e.target.value })}
                        />
                      </div>
                    )}
                    <div className="profile-field">
                      <label>Contact Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      />
                    </div>
                    <div className="profile-field">
                      <label>Email</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      />
                    </div>
                    <div className="profile-field">
                      <label>Phone</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="profile-edit-actions">
                      <button className="save-profile-btn" onClick={saveVolunteerProfile}>
                        <Save size={16} /> Save
                      </button>
                      <button className="cancel-profile-btn" onClick={() => {
                        setEditingProfile(false);
                        setProfileForm({
                          name: volunteerDetail.name || '',
                          email: volunteerDetail.email || '',
                          phone: volunteerDetail.phone || '',
                          organization: volunteerDetail.organization || '',
                        });
                      }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="volunteer-detail-title">
                      <h2>{volunteerDetail.type === 'organization' ? volunteerDetail.organization : volunteerDetail.name}</h2>
                      <button className="edit-profile-btn" onClick={() => setEditingProfile(true)}>
                        <Edit3 size={16} /> Edit
                      </button>
                    </div>
                    {volunteerDetail.type === 'organization' && (
                      <p className="volunteer-detail-contact">Contact: {volunteerDetail.name}</p>
                    )}
                    <div className="volunteer-detail-meta">
                      <span><Mail size={14} /> <a href={`mailto:${volunteerDetail.email}`}>{volunteerDetail.email}</a></span>
                      <span><Phone size={14} /> <a href={`tel:${volunteerDetail.phone}`}>{volunteerDetail.phone}</a></span>
                    </div>
                  </>
                )}
              </div>
              {!editingProfile && (
                <div className="volunteer-detail-stats">
                  <div className="detail-stat">
                    <span className="detail-stat-value">{volunteerDetail.events?.length || 0}</span>
                    <span className="detail-stat-label">Total Events</span>
                  </div>
                  <div className="detail-stat">
                    <span className="detail-stat-value">{volunteerDetail.events?.filter(e => e.status === 'completed').length || 0}</span>
                    <span className="detail-stat-label">Completed</span>
                  </div>
                  <div className="detail-stat">
                    <span className="detail-stat-value">{volunteerDetail.events?.filter(e => ['pending', 'approved'].includes(e.status)).length || 0}</span>
                    <span className="detail-stat-label">Upcoming</span>
                  </div>
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="volunteer-notes-section">
              <div className="notes-header">
                <h3><FileText size={18} /> Notes</h3>
                {!editingNotes ? (
                  <button className="edit-notes-btn" onClick={() => setEditingNotes(true)}>
                    <Edit3 size={16} /> Edit
                  </button>
                ) : (
                  <button className="save-notes-btn" onClick={saveVolunteerNotes}>
                    <Save size={16} /> Save
                  </button>
                )}
              </div>
              {editingNotes ? (
                <textarea
                  className="notes-textarea"
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Add notes about this volunteer..."
                />
              ) : (
                <p className="notes-content">{volunteerDetail.notes || 'No notes yet.'}</p>
              )}
            </div>

            {/* Event History */}
            <div className="volunteer-events-section">
              <h3>Event History</h3>
              {volunteerDetail.events && volunteerDetail.events.length > 0 ? (
                <div className="volunteer-events-list">
                  {volunteerDetail.events.map(event => (
                    <div
                      key={event.id}
                      className={`volunteer-event-item ${event.status}`}
                      onClick={() => handleViewEventFromVolunteer(event.id)}
                    >
                      <div className="volunteer-event-date">
                        <Calendar size={16} />
                        <span>{event.time_slot_day}</span>
                      </div>
                      <div className="volunteer-event-details">
                        <span className="volunteer-event-activity">{event.activity_plan}</span>
                        <span className="volunteer-event-size">{event.group_size} people</span>
                      </div>
                      {getStatusBadge(event.status)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-events">No events recorded.</p>
              )}
            </div>
          </div>
        )}

        {/* Loading state for volunteer detail */}
        {activeTab === 'volunteers' && selectedVolunteer && !volunteerDetail && (
          <div className="admin-loading">Loading volunteer details...</div>
        )}
      </div>
    </div>
  );
}

export default Admin;
