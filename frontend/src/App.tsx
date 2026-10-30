import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import BranchSelectorTestPage from "./pages/BranchSelectorTestPage";
import MainLayout from "./shared/layouts/MainLayout";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<div>Hello, World!</div>} />
          <Route path="branch-test" element={<BranchSelectorTestPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
