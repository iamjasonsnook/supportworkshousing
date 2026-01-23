import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Impact from './components/Impact';
import About from './components/About';
import Stories from './components/Stories';
import Donate from './components/Donate';
import ConnectionNights from './components/ConnectionNights';
import Footer from './components/Footer';
import ConfirmationPage from './pages/ConfirmationPage';
import './App.css';

function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Impact />
        <About />
        <Stories />
        <ConnectionNights />
        <Donate />
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/confirm" element={<ConfirmationPage />} />
    </Routes>
  );
}

export default App;
