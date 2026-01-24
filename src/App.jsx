import Header from './components/Header';
import Hero from './components/Hero';
import Impact from './components/Impact';
import ConnectionNights from './components/ConnectionNights';
import About from './components/About';
import Stories from './components/Stories';
import Donate from './components/Donate';
import Footer from './components/Footer';
import './App.css';

function App() {
  // Generate dynamic dates starting 2 weeks out, Tue/Wed/Thu only, for 3 weeks
  const generateConnectionNightsDates = () => {
    const dates = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 14); // Start 2 weeks out

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 21); // Cover 3 weeks

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
        <ConnectionNights timeSlotsByLocation={connectionNightsTimeSlots} />
      </main>
      <Footer />
    </>
  );
}

export default App;
