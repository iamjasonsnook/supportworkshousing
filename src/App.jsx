import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';
import Header from './components/Header';
import Hero from './components/Hero';
import Impact from './components/Impact';
import GetInvolved from './components/GetInvolved';
import About from './components/About';
import Stories from './components/Stories';
import Donate from './components/Donate';
import Footer from './components/Footer';
import Admin from './components/Admin';
import CareersPage from './components/CareersPage';
import JobDetail from './components/JobDetail';
import ImpactReportBanner from './components/ImpactReportBanner';
import './App.css';

function HomePage() {
  const location = useLocation();
  const [bookedDates, setBookedDates] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/booked-dates`)
      .then(r => r.json())
      .then(data => setBookedDates(data.bookedDates || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Handle hash-based scrolling (e.g., /#donate, /#volunteer)
    const hash = location.hash.replace('#', '');
    if (hash) {
      // Map friendly names to section IDs
      const hashTargets = {
        'donate': 'donate',
        'volunteer': 'get-involved',
      };
      const targetId = hashTargets[hash] || hash;

      // Small delay to ensure the page has rendered
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location]);
  // Generate dynamic dates starting 2 weeks out, Tue/Wed/Thu only, up to 2 months out
  const generateConnectionNightsDates = () => {
    const dates = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 14); // Start 2 weeks out

    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + 2); // Up to 2 months from today

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // 4 = Thursday (dinner), 6 = Saturday (lunch)
      if (dayOfWeek === 4 || dayOfWeek === 6) {
        const month = currentDate.toLocaleDateString('en-US', { month: 'long' });
        const day = currentDate.getDate();
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

        dates.push({
          id: `${dayName.toLowerCase().slice(0, 3)}-${month.toLowerCase().slice(0, 3)}-${day}`,
          day: `${dayName}, ${month} ${day}`,
          time: dayOfWeek === 4 ? '6:00 PM - 8:00 PM' : '12:00 PM - 2:00 PM'
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  const connectionNightsTimeSlots = {
    'clay-house': generateConnectionNightsDates().filter(slot => !bookedDates.includes(slot.day))
  };

  return (
    <>
      <div className="site-header-stack">
        <ImpactReportBanner />
        <Header />
      </div>
      <main>
        <Hero />
        <About />
        <Impact />
        <Stories />
        <GetInvolved timeSlotsByLocation={connectionNightsTimeSlots} />
        <Donate />
      </main>
      <Footer />
    </>
  );
}

function NotFound() {
  return (
    <>
      <Header />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#9B1B5D' }}>404</h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: '#666' }}>Page not found</p>
        <Link to="/" style={{ color: '#9B1B5D', textDecoration: 'underline', fontSize: '1.1rem' }}>Back to Home</Link>
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/careers/:jobId" element={<JobDetail />} />
<Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
