import { useState, useEffect, useMemo } from 'react';
import { Calendar, Users, MapPin, Phone, Mail, Check, X, Clock, RefreshCw, Filter, ChevronLeft, ChevronRight, Building, User, FileText, ArrowLeft, Edit3, Save, Search, Package, DollarSign, Heart, BarChart2, Send, Sparkles } from 'lucide-react';
import './Admin.css';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

function TrendChart({ current, priorYear }) {
  const [hovered, setHovered] = useState(null);
  const W = 600, H = 80, PL = 4, PR = 4, PT = 6, PB = 6;
  const allVals = [...current.map(d => d.value), ...priorYear.map(d => d.value)];
  const max = Math.max(...allVals, 1);

  const toCoords = (data) =>
    data.map((d, i) => ({
      x: PL + (i / Math.max(data.length - 1, 1)) * (W - PL - PR),
      y: PT + (1 - d.value / max) * (H - PT - PB),
    }));

  const curCoords = toCoords(current);
  const yoyCoords = toCoords(priorYear);
  const toPointsStr = (coords) => coords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(relX * (current.length - 1));
    setHovered(Math.max(0, Math.min(current.length - 1, idx)));
  };

  const hp = hovered !== null ? curCoords[hovered] : null;
  const hpXPct = hp ? (hp.x / W) * 100 : null;

  const formatDate = (yyyymmdd) => {
    const s = String(yyyymmdd);
    const d = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="trend-svg-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="trend-svg"
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        {yoyCoords.length > 1 && <polyline points={toPointsStr(yoyCoords)} fill="none" stroke="#E5E7EB" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {curCoords.length > 1 && <polyline points={toPointsStr(curCoords)} fill="none" stroke="#9B1B5D" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
        {hp && (
          <>
            <line x1={hp.x} y1={PT} x2={hp.x} y2={H - PB} stroke="#9B1B5D" strokeWidth="1" strokeDasharray="3,2" opacity="0.4" />
            <circle cx={hp.x} cy={hp.y} r="3.5" fill="#9B1B5D" />
          </>
        )}
      </svg>
      {hovered !== null && hp && (
        <div
          className="trend-tooltip"
          style={{
            left: `${hpXPct}%`,
            transform: hpXPct > 60 ? 'translateX(calc(-100% - 8px))' : 'translateX(8px)',
          }}
        >
          <span className="trend-tooltip-date">{formatDate(current[hovered].date)}</span>
          <span className="trend-tooltip-value">{current[hovered].value.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [supplyDrives, setSupplyDrives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(['pending', 'approved']);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'connection-night', 'supply-drive'
  const [actionLoading, setActionLoading] = useState(null);
  const [calendarView, setCalendarView] = useState('month'); // 'week' or 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Volunteer management state
  const [activeTab, setActiveTab] = useState('events'); // 'events' or 'volunteers'
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [volunteerDetail, setVolunteerDetail] = useState(null);
  const [peopleFilters, setPeopleFilters] = useState([]); // toggleable: 'organization', 'individual', 'volunteer', 'donor'
  const [volunteerSearch, setVolunteerSearch] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', organization: '' });
  const [statsTimeframe, setStatsTimeframe] = useState('all'); // 'all', 'year', 'quarter', 'month'
  const [stats, setStats] = useState(null);

  // Donation management state
  const [donations, setDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [donationFilter, setDonationFilter] = useState('all'); // 'all', 'one-time', 'monthly'
  const [donationSearch, setDonationSearch] = useState('');
  const [donationSort, setDonationSort] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest'

  // GA4 Analytics state
  const [ga4Data, setGa4Data] = useState(null);
  const [ga4Loading, setGa4Loading] = useState(false);
  const [ga4Error, setGa4Error] = useState('');
  const [ga4Range, setGa4Range] = useState('30');
  const [ga4Fetched, setGa4Fetched] = useState(false);

  // AI analysis state
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Communications tab
  const [commSubject, setCommSubject] = useState('');
  const [commHtml, setCommHtml] = useState('');
  const [commRecipients, setCommRecipients] = useState('');
  const [commBcc, setCommBcc] = useState('');
  const [commView, setCommView] = useState('editor'); // 'editor' | 'preview'
  const [commSending, setCommSending] = useState(false);
  const [commResult, setCommResult] = useState(null);

  const togglePeopleFilter = (filter) => {
    setPeopleFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Check for existing session
  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (session) {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch events, volunteers, and donations when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
      fetchVolunteers();
      fetchStats();
      fetchDonations();
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
      if (data.supplyDrives) {
        setSupplyDrives(data.supplyDrives);
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

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem('admin_session');
      const response = await fetch(`${API_BASE}/api/admin/donations`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();
      if (data.donations) {
        setDonations(data.donations);
      }
    } catch (err) {
      console.error('Failed to fetch donations:', err);
    }
  };

  const fetchGa4Data = async (range) => {
    setGa4Loading(true);
    setGa4Error('');
    try {
      const token = localStorage.getItem('admin_session');
      const response = await fetch(`${API_BASE}/api/admin/ga4-report?range=${range}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();
      setGa4Data(data);
      setGa4Fetched(true);
    } catch (err) {
      setGa4Error('Failed to load analytics data.');
    } finally {
      setGa4Loading(false);
    }
  };

  const fetchAiAnalysis = async () => {
    if (!ga4Data) return;
    setAiLoading(true);
    setAiError('');
    try {
      const token = localStorage.getItem('admin_session');
      const response = await fetch(`${API_BASE}/api/admin/ai-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ga4Data, range: ga4Range }),
      });
      if (response.status === 401) { handleLogout(); return; }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAiAnalysis(data.analysis);
    } catch (err) {
      setAiError('Failed to generate analysis. Please try again.');
    } finally {
      setAiLoading(false);
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
    if (!confirm(`Approve Community Connection for ${event.group_name}?`)) return;

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
    const reason = prompt(`Deny Community Connection for ${event.group_name}?\n\nEnter a reason (optional):`);
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
      } else {
        const data = await response.json().catch(() => ({}));
        alert(`Failed to deny event: ${data.error || response.status}`);
      }
    } catch (err) {
      console.error('Deny failed:', err);
      alert('Failed to deny event. Check that the admin server is running.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteEvent = async (event) => {
    if (!confirm(`Mark Community Connection for ${event.group_name} as completed?`)) return;
    setActionLoading(event.id);
    try {
      const token = localStorage.getItem('admin_session');
      const response = await fetch(`${API_BASE}/api/admin/events/${event.id}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) fetchEvents();
    } catch (err) {
      console.error('Complete failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveSupplyDrive = async (drive) => {
    if (!confirm(`Approve Supply Drive from ${drive.contact_name}?`)) return;

    setActionLoading(drive.id);
    try {
      const token = localStorage.getItem('admin_session');
      const response = await fetch(`${API_BASE}/api/admin/supply-drives/${drive.id}/approve`, {
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

  const handleDenySupplyDrive = async (drive) => {
    const reason = prompt(`Deny Supply Drive from ${drive.contact_name}?\n\nEnter a reason (optional):`);
    if (reason === null) return;

    setActionLoading(drive.id);
    try {
      const token = localStorage.getItem('admin_session');
      const response = await fetch(`${API_BASE}/api/admin/supply-drives/${drive.id}/deny`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        fetchEvents();
      } else {
        const data = await response.json().catch(() => ({}));
        alert(`Failed to deny supply drive: ${data.error || response.status}`);
      }
    } catch (err) {
      console.error('Deny failed:', err);
      alert('Failed to deny supply drive. Check that the admin server is running.');
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
    // Parse "Tuesday, February 11" format for connection nights
    // or "Friday, February 14" for supply drives
    const dayStr = event.time_slot_day || event.drop_off_date;
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

  // Combine events and supply drives for calendar display
  const allCalendarItems = useMemo(() => {
    const filteredEvts = events;
    const filteredDrives = supplyDrives;
    return [
      ...filteredEvts.map(e => ({ ...e, itemType: 'connection-night' })),
      ...filteredDrives.map(e => ({ ...e, itemType: 'supply-drive' })),
    ];
  }, [events, supplyDrives]);

  const getEventsForDate = (date) => {
    return allCalendarItems.filter(item => {
      const itemDate = parseEventDate(item);
      if (!itemDate) return false;
      return itemDate.toDateString() === date.toDateString();
    });
  };

  const getCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Helper to get Monday-based day index (Monday=0, Sunday=6)
    const getMondayBasedDay = (date) => {
      const day = date.getDay();
      return day === 0 ? 6 : day - 1;
    };

    if (calendarView === 'month') {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startPadding = getMondayBasedDay(firstDay);
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
      // Week view - start on Monday
      const startOfWeek = new Date(currentDate);
      const dayOfWeek = currentDate.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startOfWeek.setDate(currentDate.getDate() + mondayOffset);
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
      setFilter([]);
    }
  };

  // Filter events based on selected date or filter
  const displayedEvents = useMemo(() => {
    const filteredEvts = events;
    const filteredDrives = supplyDrives;

    // Build base item list respecting type filter
    let evtItems = typeFilter !== 'supply-drive' ? filteredEvts.map(e => ({ ...e, itemType: 'connection-night' })) : [];
    let driveItems = typeFilter !== 'connection-night' ? filteredDrives.map(e => ({ ...e, itemType: 'supply-drive' })) : [];

    if (selectedDate) {
      const allItems = [...evtItems, ...driveItems]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return allItems.filter(item => {
        const itemDate = parseEventDate(item);
        if (!itemDate) return false;
        return itemDate.toDateString() === selectedDate.toDateString();
      });
    }

    const allItems = [...evtItems, ...driveItems]
      .sort((a, b) => (parseEventDate(a) || 0) - (parseEventDate(b) || 0));

    if (filter.length > 0) {
      return allItems.filter(e => filter.includes(e.status));
    }

    return allItems;
  }, [events, supplyDrives, filter, typeFilter, selectedDate]);

  // Calculate stats based on timeframe
  // Estimated values for supply drive items (for in-kind donation records)
  const itemValues = {
    // Cleaning Supplies
    'Dish soap': 4, 'Laundry detergent': 12, 'Trash bags': 8, 'Paper towels': 8, 'Sponges': 3,
    // Toiletries (~$3-8 each)
    'Toilet paper': 10, 'Shampoo': 6, 'Conditioner': 6, 'Body wash/soap': 5,
    'Toothpaste': 4, 'Toothbrushes': 3, 'Deodorant': 5, 'Feminine hygiene products': 8,
    // Linens (~$15-30 each)
    'Bath towels': 12, 'Washcloths': 5, 'Twin sheets': 25, 'Pillows': 15, 'Blankets': 20, 'Bathmat': 12, 'Shower curtain': 15,
    // Non-Perishable Food (~$2-5 each)
    'Canned vegetables': 2, 'Canned soup': 3, 'Pasta': 2, 'Rice': 4,
    'Peanut butter': 5, 'Jelly': 4, 'Cereal': 5, 'Canned tuna/chicken': 3, 'Cooking oil': 6,
  };
  const defaultItemValue = 8; // Default value for unlisted items

  const calculatedStats = useMemo(() => {
    const baseEvents = events;
    const baseDrives = supplyDrives;
    const baseVolunteers = volunteers;
    const baseDonations = donations;

    if (!baseEvents.length && !baseDrives.length) return null;

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
      ? baseEvents.filter(e => {
          const eventDate = e.completed_at ? new Date(e.completed_at) : new Date(e.created_at);
          return eventDate >= startDate;
        })
      : baseEvents;

    const filteredSupplyDrives = startDate
      ? baseDrives.filter(e => {
          const eventDate = e.completed_at ? new Date(e.completed_at) : new Date(e.created_at);
          return eventDate >= startDate;
        })
      : baseDrives;

    const completedEvents = filteredEvents.filter(e => e.status === 'completed').length;
    const pendingEvents = filteredEvents.filter(e => e.status === 'pending').length
      + filteredSupplyDrives.filter(e => e.status === 'pending').length;
    const totalVolunteerHours = filteredEvents
      .filter(e => e.status === 'completed')
      .reduce((sum, e) => sum + (e.group_size * 2), 0);

    // Calculate in-kind donation value from completed supply drives
    const inKindValue = filteredSupplyDrives
      .filter(e => e.status === 'completed')
      .reduce((sum, drive) => {
        const driveValue = (drive.items || []).reduce((itemSum, item) => {
          return itemSum + (itemValues[item] || defaultItemValue);
        }, 0);
        return sum + driveValue;
      }, 0);

    // Count unique volunteers in the timeframe
    const allVolunteerIds = [
      ...filteredEvents.map(e => e.volunteer_id),
      ...filteredSupplyDrives.map(e => e.volunteer_id),
    ];
    const uniqueVolunteerIds = new Set(allVolunteerIds.filter(Boolean));

    // Donation stats for timeframe
    const filteredDonations = startDate
      ? baseDonations.filter(d => new Date(d.created_at) >= startDate)
      : baseDonations;
    const totalDonationAmount = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
    const donationCount = filteredDonations.length;

    return {
      totalVolunteers: statsTimeframe === 'all' ? baseVolunteers.length : uniqueVolunteerIds.size,
      completedEvents: completedEvents + filteredSupplyDrives.filter(e => e.status === 'completed').length,
      pendingEvents,
      totalVolunteerHours,
      inKindValue,
      totalDonationAmount,
      donationCount,
    };
  }, [events, supplyDrives, volunteers, donations, statsTimeframe]);

  // Filter volunteers based on type, role, and search query
  const displayedVolunteers = useMemo(() => {
    let filtered = volunteers;

    // Type filters (OR within category)
    const typeFilters = peopleFilters.filter(f => ['organization', 'individual'].includes(f));
    if (typeFilters.length > 0) {
      filtered = filtered.filter(v => typeFilters.includes(v.type));
    }

    // Role filters (AND — must have all selected roles)
    const roleFilters = peopleFilters.filter(f => ['volunteer', 'donor'].includes(f));
    if (roleFilters.length > 0) {
      filtered = filtered.filter(v =>
        roleFilters.every(role => v.roles?.includes(role))
      );
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
  }, [volunteers, peopleFilters, volunteerSearch]);

  // Filter and sort donations
  const displayedDonations = useMemo(() => {
    let filtered = donations;

    if (donationFilter !== 'all') {
      filtered = filtered.filter(d => d.donation_type === donationFilter);
    }

    if (donationSearch.trim()) {
      const query = donationSearch.toLowerCase();
      filtered = filtered.filter(d =>
        d.donor_name.toLowerCase().includes(query) ||
        d.donor_email.toLowerCase().includes(query)
      );
    }

    const sorted = [...filtered];
    switch (donationSort) {
      case 'oldest':
        sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'highest':
        sorted.sort((a, b) => b.amount - a.amount);
        break;
      case 'lowest':
        sorted.sort((a, b) => a.amount - b.amount);
        break;
      default: // newest
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return sorted;
  }, [donations, donationFilter, donationSearch, donationSort]);

  // Donation summary stats
  const donationStats = useMemo(() => {
    const baseDonations = donations;
    if (!baseDonations.length) return null;
    const total = baseDonations.reduce((sum, d) => sum + d.amount, 0);
    const uniqueDonors = new Set(baseDonations.map(d => d.donor_email)).size;
    const monthlyCount = baseDonations.filter(d => d.donation_type === 'monthly').length;
    return {
      total,
      count: baseDonations.length,
      average: Math.round(total / baseDonations.length),
      uniqueDonors,
      monthlyCount,
    };
  }, [donations]);

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="SupportWorks Housing" style={{ width: 48, height: 48 }} />
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
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="SupportWorks Housing" style={{ width: 32, height: 32 }} />
          <div>
            <h1>Admin Dashboard</h1>
            <p>SupportWorks Housing</p>
          </div>
        </div>
        <div className="admin-header-right">
          <button onClick={handleLogout} className="admin-btn-logout">
            Log Out
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
            <div className="stat-item">
              <span className="stat-value">${calculatedStats.inKindValue?.toLocaleString() || 0}</span>
              <span className="stat-label">In-Kind<br />Value</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{calculatedStats.donationCount}</span>
              <span className="stat-label">Donations</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">${calculatedStats.totalDonationAmount?.toLocaleString() || 0}</span>
              <span className="stat-label">Amount<br />Raised</span>
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
          People
        </button>
        <button
          className={`admin-tab ${activeTab === 'donations' ? 'active' : ''}`}
          onClick={() => { setActiveTab('donations'); setSelectedDonation(null); }}
        >
          <DollarSign size={18} />
          Donations
        </button>
        <button
          className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('analytics');
            if (!ga4Fetched) fetchGa4Data(ga4Range);
          }}
        >
          <BarChart2 size={18} />
          Analytics
        </button>
        <button
          className={`admin-tab ${activeTab === 'communications' ? 'active' : ''}`}
          onClick={() => setActiveTab('communications')}
        >
          <Mail size={18} />
          Communications
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
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
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
            <button
              className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTypeFilter('all')}
            >
              All Types
            </button>
            <button
              className={`filter-btn ${typeFilter === 'connection-night' ? 'active' : ''}`}
              onClick={() => setTypeFilter('connection-night')}
            >
              <Users size={14} />
              Connections
            </button>
            <button
              className={`filter-btn ${typeFilter === 'supply-drive' ? 'active' : ''}`}
              onClick={() => setTypeFilter('supply-drive')}
            >
              <Package size={14} />
              Supply Drives
            </button>
            <span className="filter-divider" />
            {selectedDate && (
              <button
                className="filter-btn active"
                onClick={() => setSelectedDate(null)}
              >
                {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ✕
              </button>
            )}
            <button
              className={`filter-btn ${filter.length === 0 && !selectedDate ? 'active' : ''}`}
              onClick={() => { setFilter([]); setSelectedDate(null); }}
            >
              All ({allCalendarItems.length})
            </button>
            {['pending', 'approved', 'completed', 'denied'].map(status => (
              <button
                key={status}
                className={`filter-btn ${filter.includes(status) && !selectedDate ? 'active' : ''}`}
                onClick={() => {
                  setSelectedDate(null);
                  setFilter(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({allCalendarItems.filter(e => e.status === status).length})
              </button>
            ))}
          </div>
        </div>

        {loading && events.length === 0 ? (
          <div className="admin-loading">Loading events...</div>
        ) : displayedEvents.length === 0 ? (
          <div className="admin-empty">
            <Calendar size={48} />
            <p>No {filter.length > 0 ? filter.join('/') : ''} events found</p>
          </div>
        ) : (
          <div className="admin-events">
            {displayedEvents.map((item) => {
              const volunteer = getVolunteerForEvent(item);
              const isSupplyDrive = item.itemType === 'supply-drive';

              return (
              <div key={item.id} id={`event-${item.id}`} className={`event-card ${isSupplyDrive ? 'supply-drive-card' : ''}`}>
                <div className="event-header">
                  <div className="event-title">
                    <div className="event-type-badge">
                      {isSupplyDrive ? <Package size={16} /> : <Users size={16} />}
                      <span>{isSupplyDrive ? 'Supply Drive' : 'Community Connections'}</span>
                    </div>
                    <h3>{isSupplyDrive ? (item.organization || item.contact_name) : item.group_name}</h3>
                    {getStatusBadge(item.status)}
                  </div>
                  <span className="event-date">Submitted {formatDate(item.created_at)}</span>
                </div>

                <div className={`event-details${isSupplyDrive ? ' event-details-supply' : ''}`}>
                  <div className="event-detail event-detail-date">
                    <Calendar size={16} />
                    <span>{isSupplyDrive ? `${item.drop_off_date}, ${item.drop_off_time}` : `${item.time_slot_day}, ${item.time_slot_time}`}</span>
                  </div>
                  <div className="event-detail">
                    <MapPin size={16} />
                    <span>{item.location_name}</span>
                  </div>
                  {!isSupplyDrive && (
                    <div className="event-detail">
                      <Users size={16} />
                      <span>{item.group_size} people</span>
                    </div>
                  )}
                  <div className="event-detail">
                    <Mail size={16} />
                    <a href={`mailto:${item.contact_email}`}>{item.contact_email}</a>
                  </div>
                  <div className="event-detail">
                    <Phone size={16} />
                    <a href={`tel:${item.contact_phone}`}>{item.contact_phone}</a>
                  </div>
                </div>

                {isSupplyDrive ? (
                  <div className="event-info" style={{ alignItems: 'center' }}>
                    <div className="info-item">
                      <strong>Contact:</strong> {item.contact_name}
                    </div>
                    <div className="info-item supply-items">
                      <strong>Items:</strong>
                      <div className="supply-items-list">
                        {item.items?.map((supply, idx) => (
                          <span key={idx} className="supply-item-tag">{supply}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="event-info">
                    <div className="info-item">
                      <strong>Contact:</strong> {item.contact_name}
                    </div>
                    <div className="info-item">
                      <strong>Food Plan:</strong> {item.food_plan === 'bring' ? 'Bringing food' : 'Catering'}
                    </div>
                    <div className="info-item">
                      <strong>Activity:</strong> {item.activity_plan}
                    </div>
                  </div>
                )}

                {/* Volunteer Link */}
                {volunteer && !isSupplyDrive && (
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

                {item.status === 'pending' && (
                  <div className="event-actions">
                    <button
                      className="admin-btn-approve"
                      onClick={() => isSupplyDrive ? handleApproveSupplyDrive(item) : handleApprove(item)}
                      disabled={actionLoading === item.id}
                    >
                      <Check size={18} />
                      Approve
                    </button>
                    <button
                      className="admin-btn-deny"
                      onClick={() => isSupplyDrive ? handleDenySupplyDrive(item) : handleDeny(item)}
                      disabled={actionLoading === item.id}
                    >
                      <X size={18} />
                      Deny
                    </button>
                  </div>
                )}

                {item.status === 'approved' && !isSupplyDrive && (
                  <div className="event-actions">
                    <button
                      className="admin-btn-complete"
                      onClick={() => handleCompleteEvent(item)}
                      disabled={actionLoading === item.id}
                    >
                      <Check size={18} />
                      Mark Complete
                    </button>
                    <button
                      className="admin-btn-deny"
                      onClick={() => handleDeny(item)}
                      disabled={actionLoading === item.id}
                    >
                      <X size={18} />
                      Deny
                    </button>
                  </div>
                )}

                {item.status === 'denied' && item.denial_reason && (
                  <div className="event-denial-reason">
                    <strong>Denial reason:</strong> {item.denial_reason}
                  </div>
                )}
              </div>
            );
            })}
          </div>
        )}
          </>
        )}

        {/* People Tab */}
        {activeTab === 'volunteers' && !selectedVolunteer && (
          <>
            <div className="admin-toolbar volunteer-toolbar">
              <div className="admin-filters">
                <Filter size={18} />
                <button
                  className={`filter-btn ${peopleFilters.includes('organization') ? 'active' : ''}`}
                  onClick={() => togglePeopleFilter('organization')}
                >
                  <Building size={14} />
                  Organizations ({(volunteers).filter(v => v.type === 'organization').length})
                  {peopleFilters.includes('organization') && <X size={12} className="filter-x" />}
                </button>
                <button
                  className={`filter-btn ${peopleFilters.includes('individual') ? 'active' : ''}`}
                  onClick={() => togglePeopleFilter('individual')}
                >
                  <User size={14} />
                  Individuals ({(volunteers).filter(v => v.type === 'individual').length})
                  {peopleFilters.includes('individual') && <X size={12} className="filter-x" />}
                </button>
                <span className="filter-divider" />
                <button
                  className={`filter-btn ${peopleFilters.includes('volunteer') ? 'active' : ''}`}
                  onClick={() => togglePeopleFilter('volunteer')}
                >
                  Volunteers ({(volunteers).filter(v => v.roles?.includes('volunteer')).length})
                  {peopleFilters.includes('volunteer') && <X size={12} className="filter-x" />}
                </button>
                <button
                  className={`filter-btn ${peopleFilters.includes('donor') ? 'active' : ''}`}
                  onClick={() => togglePeopleFilter('donor')}
                >
                  Donors ({(volunteers).filter(v => v.roles?.includes('donor')).length})
                  {peopleFilters.includes('donor') && <X size={12} className="filter-x" />}
                </button>
              </div>
              <div className="volunteer-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search people..."
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

            {displayedVolunteers.length === 0 ? (
              <div className="admin-empty">
                <Users size={48} />
                <p>No people found</p>
              </div>
            ) : (
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
                      <div className="volunteer-name-row">
                        <h3>{volunteer.type === 'organization' ? volunteer.organization : volunteer.name}</h3>
                        <div className="role-badges">
                          {volunteer.roles?.includes('volunteer') && (
                            <span className="role-badge role-volunteer">Volunteer</span>
                          )}
                          {volunteer.roles?.includes('donor') && (
                            <span className="role-badge role-donor">Donor</span>
                          )}
                        </div>
                      </div>
                      {volunteer.type === 'organization' && (
                        <p className="volunteer-contact">{volunteer.name}</p>
                      )}
                    </div>
                    <div className="volunteer-stats">
                      {volunteer.roles?.includes('volunteer') && (
                        <>
                          <div className="volunteer-stat">
                            <span className="stat-number">{volunteer.completed_events || 0}</span>
                            <span className="stat-label">Completed</span>
                          </div>
                          <div className="volunteer-stat">
                            <span className="stat-number">{volunteer.upcoming_events || 0}</span>
                            <span className="stat-label">Upcoming</span>
                          </div>
                        </>
                      )}
                      {volunteer.total_donated > 0 && (
                        <div className="volunteer-stat">
                          <span className="stat-number">${volunteer.total_donated.toLocaleString()}</span>
                          <span className="stat-label">Donated</span>
                        </div>
                      )}
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
            )}
          </>
        )}

        {/* Person Detail View */}
        {activeTab === 'volunteers' && selectedVolunteer && volunteerDetail && (
          <div className="volunteer-detail">
            <button className="back-btn" onClick={handleBackToVolunteerList}>
              <ArrowLeft size={18} />
              Back to People
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
                      <div className="role-badges">
                        {volunteerDetail.roles?.includes('volunteer') && (
                          <span className="role-badge role-volunteer">Volunteer</span>
                        )}
                        {volunteerDetail.roles?.includes('donor') && (
                          <span className="role-badge role-donor">Donor</span>
                        )}
                      </div>
                      {!volunteerDetail.id.startsWith('donor-') && (
                        <button className="edit-profile-btn" onClick={() => setEditingProfile(true)}>
                          <Edit3 size={16} /> Edit
                        </button>
                      )}
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
                  {volunteerDetail.roles?.includes('volunteer') && (
                    <>
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
                    </>
                  )}
                  {volunteerDetail.total_donated > 0 && (
                    <>
                      <div className="detail-stat">
                        <span className="detail-stat-value">${volunteerDetail.total_donated?.toLocaleString()}</span>
                        <span className="detail-stat-label">Total Donated</span>
                      </div>
                      <div className="detail-stat">
                        <span className="detail-stat-value">{volunteerDetail.donation_count}</span>
                        <span className="detail-stat-label">Donations</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Notes Section */}
            {!volunteerDetail.id.startsWith('donor-') && (
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
                    placeholder="Add notes about this person..."
                  />
                ) : (
                  <p className="notes-content">{volunteerDetail.notes || 'No notes yet.'}</p>
                )}
              </div>
            )}

            {/* Donation History */}
            {volunteerDetail.donations && volunteerDetail.donations.length > 0 && (
              <div className="volunteer-donations-section">
                <h3><Heart size={18} /> Donation History</h3>
                <div className="volunteer-donations-list">
                  {volunteerDetail.donations.map(donation => (
                    <div key={donation.id} className="volunteer-donation-item">
                      <div className="volunteer-donation-date">
                        <DollarSign size={16} />
                        <span>{new Date(donation.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="volunteer-donation-details">
                        <span className="volunteer-donation-amount">${donation.amount.toLocaleString()}</span>
                        <span className={`donation-type-badge ${donation.donation_type}`}>
                          {donation.donation_type === 'monthly' ? 'Monthly' : 'One-time'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event History */}
            {volunteerDetail.events && volunteerDetail.events.length > 0 && (
              <div className="volunteer-events-section">
                <h3>Event History</h3>
                <div className="volunteer-events-list">
                  {volunteerDetail.events.map(event => {
                    const isSupplyDrive = event.event_type === 'supply-drive';
                    return (
                      <div
                        key={event.id}
                        className={`volunteer-event-item ${event.status} ${isSupplyDrive ? 'supply-drive' : ''}`}
                        onClick={() => handleViewEventFromVolunteer(event.id)}
                      >
                        <div className="volunteer-event-date">
                          {isSupplyDrive ? <Package size={16} /> : <Calendar size={16} />}
                          <span>{isSupplyDrive ? event.drop_off_date : event.time_slot_day}</span>
                        </div>
                        <div className="volunteer-event-details">
                          {isSupplyDrive ? (
                            <>
                              <span className="volunteer-event-activity">Supply Drive</span>
                              <span className="volunteer-event-size">{(event.selected_items || event.items || []).length} items</span>
                            </>
                          ) : (
                            <>
                              <span className="volunteer-event-activity">{event.activity_plan ? event.activity_plan.charAt(0).toUpperCase() + event.activity_plan.slice(1) : ''}</span>
                              <span className="volunteer-event-size">{event.group_size} people</span>
                            </>
                          )}
                        </div>
                        {getStatusBadge(event.status)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Show message when no events and no donations */}
            {(!volunteerDetail.events || volunteerDetail.events.length === 0) &&
             (!volunteerDetail.donations || volunteerDetail.donations.length === 0) && (
              <p className="no-events">No activity recorded.</p>
            )}
          </div>
        )}

        {/* Loading state for volunteer detail */}
        {activeTab === 'volunteers' && selectedVolunteer && !volunteerDetail && (
          <div className="admin-loading">Loading person details...</div>
        )}

        {/* Donations Tab — List View */}
        {activeTab === 'donations' && !selectedDonation && (
          <>
            {donationStats && (
              <div className="donation-summary-bar">
                <div className="donation-summary-card">
                  <DollarSign size={24} />
                  <div>
                    <span className="summary-value">${donationStats.total.toLocaleString()}</span>
                    <span className="summary-label">Total Raised</span>
                  </div>
                </div>
                <div className="donation-summary-card">
                  <Heart size={24} />
                  <div>
                    <span className="summary-value">{donationStats.count}</span>
                    <span className="summary-label">Donations</span>
                  </div>
                </div>
                <div className="donation-summary-card">
                  <DollarSign size={24} />
                  <div>
                    <span className="summary-value">${donationStats.average.toLocaleString()}</span>
                    <span className="summary-label">Average</span>
                  </div>
                </div>
                <div className="donation-summary-card">
                  <Users size={24} />
                  <div>
                    <span className="summary-value">{donationStats.uniqueDonors}</span>
                    <span className="summary-label">Unique Donors</span>
                  </div>
                </div>
                <div className="donation-summary-card">
                  <RefreshCw size={24} />
                  <div>
                    <span className="summary-value">{donationStats.monthlyCount}</span>
                    <span className="summary-label">Monthly</span>
                  </div>
                </div>
              </div>
            )}

            <div className="admin-toolbar donation-toolbar">
              <div className="admin-filters">
                <Filter size={18} />
                <button
                  className={`filter-btn ${donationFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setDonationFilter('all')}
                >
                  All ({(donations).length})
                </button>
                <button
                  className={`filter-btn ${donationFilter === 'one-time' ? 'active' : ''}`}
                  onClick={() => setDonationFilter('one-time')}
                >
                  One-time ({(donations).filter(d => d.donation_type === 'one-time').length})
                </button>
                <button
                  className={`filter-btn ${donationFilter === 'monthly' ? 'active' : ''}`}
                  onClick={() => setDonationFilter('monthly')}
                >
                  Monthly ({(donations).filter(d => d.donation_type === 'monthly').length})
                </button>
              </div>
              <div className="donation-controls">
                <select
                  className="donation-sort"
                  value={donationSort}
                  onChange={(e) => setDonationSort(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Amount</option>
                  <option value="lowest">Lowest Amount</option>
                </select>
                <div className="volunteer-search">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search donors..."
                    value={donationSearch}
                    onChange={(e) => setDonationSearch(e.target.value)}
                  />
                  {donationSearch && (
                    <button
                      className="search-clear"
                      onClick={() => setDonationSearch('')}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {displayedDonations.length === 0 ? (
              <div className="admin-empty">
                <DollarSign size={48} />
                <p>No donations found</p>
              </div>
            ) : (
              <div className="donation-list">
                {displayedDonations.map(donation => (
                  <div
                    key={donation.id}
                    className="donation-card"
                    onClick={() => setSelectedDonation(donation.id)}
                  >
                    <div className="donation-card-left">
                      <span className="donation-card-amount">${donation.amount.toLocaleString()}</span>
                      <span className={`donation-type-badge ${donation.donation_type}`}>
                        {donation.donation_type === 'monthly' ? 'Monthly' : 'One-time'}
                      </span>
                    </div>
                    <div className="donation-card-center">
                      <span className="donation-card-name">{donation.donor_name}</span>
                      <span className="donation-card-email">{donation.donor_email}</span>
                    </div>
                    <div className="donation-card-right">
                      <span className="donation-card-date">
                        {new Date(donation.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {donation.volunteer_id && (
                        <span className="donation-card-volunteer-badge">Also volunteers</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Donations Tab — Detail View */}
        {activeTab === 'donations' && selectedDonation && (() => {
          const donation = donations.find(d => d.id === selectedDonation);
          if (!donation) return null;
          const linkedVolunteer = donation.volunteer_id
            ? volunteers.find(v => v.id === donation.volunteer_id)
            : null;
          const personId = donation.volunteer_id || `donor-${donation.donor_email}`;

          return (
            <div className="donation-detail">
              <button className="back-btn" onClick={() => setSelectedDonation(null)}>
                <ArrowLeft size={18} />
                Back to Donations
              </button>

              <div className="donation-detail-header">
                <div className="donation-detail-amount">
                  ${donation.amount.toLocaleString()}
                </div>
                <span className={`donation-type-badge ${donation.donation_type}`}>
                  {donation.donation_type === 'monthly' ? 'Monthly' : 'One-time'}
                </span>
                <div className="donation-detail-date">
                  {new Date(donation.created_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="donation-detail-sections">
                <div className="donation-detail-section">
                  <h3><User size={18} /> Donor Information</h3>
                  <div className="donation-detail-fields">
                    <div className="donation-detail-field">
                      <span className="field-label">Name</span>
                      <span className="field-value">{donation.donor_name}</span>
                    </div>
                    <div className="donation-detail-field">
                      <span className="field-label">Email</span>
                      <span className="field-value">
                        <a href={`mailto:${donation.donor_email}`}>{donation.donor_email}</a>
                      </span>
                    </div>
                    <div className="donation-detail-field">
                      <span className="field-label">Phone</span>
                      <span className="field-value">
                        <a href={`tel:${donation.donor_phone}`}>{donation.donor_phone}</a>
                      </span>
                    </div>
                    <div className="donation-detail-field">
                      <span className="field-label">Address</span>
                      <span className="field-value">{donation.donor_address}</span>
                    </div>
                  </div>
                </div>

                <div className="donation-detail-section">
                  <h3><DollarSign size={18} /> Transaction</h3>
                  <div className="donation-detail-fields">
                    <div className="donation-detail-field">
                      <span className="field-label">Transaction ID</span>
                      <span className="field-value donation-txn-id">{donation.payment_intent_id}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="donation-detail-actions">
                <button
                  className="donation-view-profile-btn"
                  onClick={() => {
                    setSelectedDonation(null);
                    setActiveTab('volunteers');
                    handleViewVolunteer(personId);
                  }}
                >
                  <User size={16} />
                  View Profile
                  {linkedVolunteer && <span className="donation-card-volunteer-badge">Also volunteers</span>}
                </button>
              </div>
            </div>
          );
        })()}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <div className="analytics-header">
              <h2><BarChart2 size={20} /> Conversion Funnels</h2>
              <div className="analytics-range-selector">
                {['7', '30', '90'].map((r) => (
                  <button
                    key={r}
                    className={`range-btn ${ga4Range === r ? 'active' : ''}`}
                    onClick={() => {
                      setGa4Range(r);
                      setAiAnalysis(null);
                      fetchGa4Data(r);
                    }}
                  >
                    {r}d
                  </button>
                ))}
              </div>
            </div>

            {ga4Loading && (
              <div className="analytics-loading">
                <RefreshCw size={20} className="spin" />
                Loading analytics data…
              </div>
            )}

            {!ga4Loading && ga4Error && (
              <div className="analytics-error">{ga4Error}</div>
            )}

            {!ga4Loading && ga4Data && !ga4Data.configured && (
              <div className="analytics-setup-msg">
                <BarChart2 size={32} />
                <h3>GA4 Not Configured</h3>
                <p>{ga4Data.message}</p>
                <ol>
                  <li>Go to console.cloud.google.com → enable "Google Analytics Data API"</li>
                  <li>Create a service account and download the JSON key</li>
                  <li>In GA4: Admin → Property access management → add service account email as Viewer</li>
                  <li>Add to Vercel: <code>GA4_PROPERTY_ID</code>, <code>GA4_SERVICE_ACCOUNT_EMAIL</code>, <code>GA4_PRIVATE_KEY</code></li>
                </ol>
              </div>
            )}

            {!ga4Loading && ga4Data?.configured && (
              <>
                {ga4Data.trend && (ga4Data.trend.current.length > 1 || ga4Data.trend.priorYear.length > 1) && (
                  <div className="trend-chart-card">
                    <div className="trend-chart-header">
                      <span className="trend-chart-title">Active Users — Daily</span>
                      <div className="trend-legend">
                        <span><span className="legend-dot" style={{ background: '#9B1B5D' }} /> This period</span>
                        <span><span className="legend-dot" style={{ background: '#D1D5DB' }} /> Prior year</span>
                      </div>
                    </div>
                    <TrendChart current={ga4Data.trend.current} priorYear={ga4Data.trend.priorYear} />
                  </div>
                )}

                <div className="analytics-overview">
                  <div className="overview-metric">
                    <span className="overview-value">{ga4Data.overview.activeUsers.toLocaleString()}</span>
                    <span className="overview-label">Active Users (7d)</span>
                    <span className="overview-desc">Unique people who visited the site</span>
                  </div>
                  <div className="overview-metric">
                    <span className="overview-value">{ga4Data.overview.sessions.toLocaleString()}</span>
                    <span className="overview-label">Sessions (7d)</span>
                    <span className="overview-desc">Total visits — one person can have multiple sessions</span>
                  </div>
                  <div className="overview-metric">
                    <span className="overview-value">{ga4Data.overview.pageViews.toLocaleString()}</span>
                    <span className="overview-label">Page Views (7d)</span>
                    <span className="overview-desc">Total pages loaded across all sessions</span>
                  </div>
                </div>

                <div className="analytics-funnels">
                  {[
                    { title: 'Donations', color: '#9B1B5D', steps: ga4Data.funnels.donations },
                    { title: 'Community Connections', color: '#2563EB', steps: ga4Data.funnels.connectionNights },
                    { title: 'Supply Drives', color: '#059669', steps: ga4Data.funnels.supplyDrives },
                  ].map(({ title, color, steps }) => {
                    const topCount = steps[0]?.count || 0;
                    return (
                      <div key={title} className="analytics-funnel-card">
                        <h3 style={{ color }}>{title}</h3>
                        <div className="funnel-steps">
                          {steps.map((step, i) => {
                            const pct = topCount > 0 ? Math.round((step.count / topCount) * 100) : 0;
                            const dropOff = i > 0 && steps[i - 1].count > 0
                              ? Math.round(((steps[i - 1].count - step.count) / steps[i - 1].count) * 100)
                              : null;
                            return (
                              <div key={step.event} className="funnel-step">
                                <div className="funnel-step-label">{step.step}</div>
                                <div className="funnel-bar-wrap">
                                  <div
                                    className="funnel-bar"
                                    style={{ width: `${pct}%`, backgroundColor: color }}
                                  />
                                </div>
                                <div className="funnel-step-count">{step.count.toLocaleString()}</div>
                                {dropOff !== null && (
                                  <div className="funnel-dropoff">−{dropOff}%</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* AI Analysis */}
                <div className="ai-analysis-section">
                  <div className="ai-analysis-header">
                    <div className="ai-analysis-title">
                      <Sparkles size={18} />
                      <h3>AI Performance Report</h3>
                    </div>
                    <button
                      className="btn-generate-analysis"
                      onClick={fetchAiAnalysis}
                      disabled={aiLoading}
                    >
                      {aiLoading
                        ? <><RefreshCw size={14} className="spin" /> Generating…</>
                        : <><Sparkles size={14} /> {aiAnalysis ? 'Regenerate' : 'Generate Report'}</>}
                    </button>
                  </div>

                  {aiError && <div className="ai-analysis-error">{aiError}</div>}

                  {aiAnalysis && (
                    <div className="ai-analysis-content">
                      {aiAnalysis.headline && (
                        <p className="ai-analysis-headline">{aiAnalysis.headline}</p>
                      )}
                      <div className="ai-analysis-grid">
                        {aiAnalysis.sections.map(section => (
                          <div key={section.title} className="ai-analysis-card">
                            <h4>{section.title}</h4>
                            <p>{section.body}</p>
                          </div>
                        ))}
                      </div>
                      <div className="ai-analysis-footer">
                        Generated by Claude · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Communications Tab */}
        {activeTab === 'communications' && (
          <div className="comm-tab">
            <div className="comm-header">
              <h2><Mail size={20} /> Communications</h2>
            </div>

            <div className="comm-field">
              <label className="comm-label">Subject</label>
              <input
                type="text"
                className="comm-input"
                placeholder="Email subject line…"
                value={commSubject}
                onChange={(e) => setCommSubject(e.target.value)}
              />
            </div>

            <div className="comm-field">
              <div className="comm-view-toggle">
                <label className="comm-label">Message</label>
                <div className="comm-toggle-btns">
                  <button
                    className={`comm-toggle-btn ${commView === 'editor' ? 'active' : ''}`}
                    onClick={() => setCommView('editor')}
                  >Editor</button>
                  <button
                    className={`comm-toggle-btn ${commView === 'preview' ? 'active' : ''}`}
                    onClick={() => setCommView('preview')}
                  >Preview</button>
                </div>
              </div>
              {commView === 'editor' ? (
                <textarea
                  className="comm-html-editor"
                  placeholder="Paste your HTML here…"
                  value={commHtml}
                  onChange={(e) => setCommHtml(e.target.value)}
                  spellCheck={false}
                />
              ) : (
                <iframe
                  className="comm-preview"
                  srcDoc={commHtml || '<p style="color:#9CA3AF;font-family:sans-serif;padding:20px;">Nothing to preview yet.</p>'}
                  title="Email preview"
                  sandbox="allow-same-origin"
                />
              )}
            </div>

            <div className="comm-field">
              <label className="comm-label">Recipients <span className="comm-label-hint">(one per line or comma-separated)</span></label>
              <textarea
                className="comm-recipients"
                placeholder="email@example.com&#10;another@example.com"
                value={commRecipients}
                onChange={(e) => setCommRecipients(e.target.value)}
              />
            </div>

            <div className="comm-field">
              <label className="comm-label">BCC <span className="comm-label-hint">(one per line or comma-separated)</span></label>
              <textarea
                className="comm-recipients"
                placeholder="bcc@example.com"
                value={commBcc}
                onChange={(e) => setCommBcc(e.target.value)}
              />
            </div>

            {commResult && (
              <div className={`comm-result ${commResult.failed > 0 ? 'comm-result-warn' : 'comm-result-ok'}`}>
                {commResult.failed === 0
                  ? commResult.sent === 0 && commResult.bccCount > 0
                    ? `✓ Sent to ${commResult.bccCount} BCC recipient${commResult.bccCount !== 1 ? 's' : ''}`
                    : `✓ Sent to ${commResult.sent} recipient${commResult.sent !== 1 ? 's' : ''}${commResult.bccCount > 0 ? ` (+${commResult.bccCount} BCC)` : ''}`
                  : `Sent ${commResult.sent}, failed ${commResult.failed}: ${commResult.results.filter(r => !r.ok).map(r => r.email).join(', ')}`}
              </div>
            )}

            <button
              className="btn btn-primary comm-send-btn"
              disabled={commSending || !commSubject || !commHtml || (!commRecipients.trim() && !commBcc.trim())}
              onClick={async () => {
                const emails = commRecipients
                  .split(/[\n,]+/)
                  .map((e) => e.trim())
                  .filter(Boolean);
                const bccList = commBcc.split(/[\n,]+/).map((e) => e.trim()).filter(Boolean);
                if (emails.length === 0 && bccList.length === 0) return;
                setCommSending(true);
                setCommResult(null);
                try {
                  const token = localStorage.getItem('admin_session');
                  const res = await fetch(`${API_BASE}/api/admin/send-broadcast`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                      subject: commSubject,
                      html: commHtml,
                      emails,
                      bcc: bccList,
                    }),
                  });
                  const data = await res.json();
                  setCommResult(data);
                } catch (err) {
                  setCommResult({ sent: 0, failed: 1, results: [{ email: 'unknown', ok: false, error: err.message }] });
                } finally {
                  setCommSending(false);
                }
              }}
            >
              {commSending ? <RefreshCw size={16} className="spin" /> : <Send size={16} />}
              {commSending ? 'Sending…' : 'Send Email'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
