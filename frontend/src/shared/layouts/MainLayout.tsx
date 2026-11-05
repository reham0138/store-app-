import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

export default function MainLayout() {
  return (
    <div className="app-container lg:flex-row">
      <NavBar />
      <div className="flex min-w-0 flex-1 flex-col pt-14 lg:pt-0">\n      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
