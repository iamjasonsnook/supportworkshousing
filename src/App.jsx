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
  const connectionNightsTimeSlots = {
    'clay-house': [
      { id: 'sat-jan-25', day: 'Saturday, January 25', time: '5:00 PM - 7:00 PM' },
      { id: 'tue-jan-28', day: 'Tuesday, January 28', time: '6:00 PM - 8:00 PM' },
      { id: 'thu-jan-30', day: 'Thursday, January 30', time: '6:00 PM - 8:00 PM' },
      { id: 'sat-feb-1', day: 'Saturday, February 1', time: '5:00 PM - 7:00 PM' },
      { id: 'tue-feb-4', day: 'Tuesday, February 4', time: '6:00 PM - 8:00 PM' },
      { id: 'thu-feb-6', day: 'Thursday, February 6', time: '6:00 PM - 8:00 PM' },
    ]
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
