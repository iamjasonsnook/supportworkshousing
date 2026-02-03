import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Impact from './components/Impact';
import GetInvolved from './components/GetInvolved';
import About from './components/About';
import Stories from './components/Stories';
import Donate from './components/Donate';
import Footer from './components/Footer';
import Admin from './components/Admin';
import './App.css';

function HomePage() {
  const location = useLocation();

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
      // 2 = Tuesday, 3 = Wednesday, 4 = Thursday
      if (dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 4) {
        const month = currentDate.toLocaleDateString('en-US', { month: 'long' });
        const day = currentDate.getDate();
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

        dates.push({
          id: `${dayName.toLowerCase().slice(0, 3)}-${month.toLowerCase().slice(0, 3)}-${day}`,
          day: `${dayName}, ${month} ${day}`,
          time: '6:00 PM - 8:00 PM'
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  const connectionNightsTimeSlots = {
    'clay-house': generateConnectionNightsDates()
  };

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Impact />
        <About />
        <Stories />
        <Donate />
        <GetInvolved timeSlotsByLocation={connectionNightsTimeSlots} />
      </main>
      <Footer />
    </>
  );
}

function App() {
  // Match the base path from vite.config.js
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
