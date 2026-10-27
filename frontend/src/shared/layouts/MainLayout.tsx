import { Outlet } from 'react-router-dom';


export default function MainLayout() {
  return (
    <div className="app-container">
      <header className='m-5 '>header</header>
      <main className="main-content">
        <Outlet />   
      </main>
      <footer>footer</footer>
    </div>
  );
}