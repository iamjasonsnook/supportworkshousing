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
      { id: 'tue-feb-10', day: 'Tuesday, February 10', time: '6:00 PM - 8:00 PM' },
      { id: 'wed-feb-11', day: 'Wednesday, February 11', time: '6:00 PM - 8:00 PM' },
      { id: 'thu-feb-12', day: 'Thursday, February 12', time: '6:00 PM - 8:00 PM' },
      { id: 'tue-feb-17', day: 'Tuesday, February 17', time: '6:00 PM - 8:00 PM' },
      { id: 'wed-feb-18', day: 'Wednesday, February 18', time: '6:00 PM - 8:00 PM' },
      { id: 'thu-feb-19', day: 'Thursday, February 19', time: '6:00 PM - 8:00 PM' },
      { id: 'tue-feb-24', day: 'Tuesday, February 24', time: '6:00 PM - 8:00 PM' },
      { id: 'wed-feb-25', day: 'Wednesday, February 25', time: '6:00 PM - 8:00 PM' },
      { id: 'thu-feb-26', day: 'Thursday, February 26', time: '6:00 PM - 8:00 PM' },
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
