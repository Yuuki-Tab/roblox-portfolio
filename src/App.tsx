import { Hero } from './components/Hero';
import { Projects } from './components/Projects';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-6">
        <Hero />
        <Projects />
      </main>
      <Footer />
    </div>
  );
}
