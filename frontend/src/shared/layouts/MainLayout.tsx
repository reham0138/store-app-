import { Outlet } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

export default function MainLayout() {
  return (
    <div className="app-container">
      <NavBar />
      <main className="main-content">
        <Outlet />   
      </main>
      <Footer />
    </div>
  );
}