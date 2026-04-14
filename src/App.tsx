import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import SurveyView from './components/SurveyView';
import Admin from './components/Admin';
import SurveyEditor from './components/SurveyEditor';
import Results from './components/Results';
import AdminLogin from './components/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/survey/:code" element={<SurveyView />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/new" element={<SurveyEditor />} />
            <Route path="/admin/edit/:id" element={<SurveyEditor />} />
            <Route path="/admin/results/:id" element={<Results />} />
          </Route>
        </Routes>
        <Toaster position="top-center" />
      </div>
    </Router>
  );
}
