import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import BranchSelectorTestPage from "./pages/BranchSelectorTestPage";
import MainLayout from "./shared/layouts/MainLayout";
import ProductCatalog from './shared/components/ProductCatalog';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<ProductCatalog />} />
          <Route path="branch-test" element={<BranchSelectorTestPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
