import Header from './components/Header';
import Hero from './components/Hero';
import Impact from './components/Impact';
import About from './components/About';
import Stories from './components/Stories';
import Donate from './components/Donate';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Impact />
        <About />
        <Stories />
        <Donate />
      </main>
      <Footer />
    </>
  );
}

export default App;
