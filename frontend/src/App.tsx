import './App.css'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import MainLayout from './shared/layouts/MainLayout.tsx'
function App() {
  
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<div>Hello, World!</div>} />
          </Route>
        </Routes>
      </Router>
    </>
  )
}

export default App
