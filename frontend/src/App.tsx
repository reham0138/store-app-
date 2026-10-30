import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import BranchSelectorTestPage from "./pages/BranchSelectorTestPage";
import MainLayout from "./shared/layouts/MainLayout";
import { AuthProvider } from "./shared/contexts/AuthProvider";
import { authRoutes } from "./pages/auth/authRoutes";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<div>Hello, World!</div>} />
            <Route path="branch-test" element={<BranchSelectorTestPage />} />
            {authRoutes}
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
