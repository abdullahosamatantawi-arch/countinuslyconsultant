import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { BlueprintComparison } from './pages/BlueprintComparison';
import { Login } from './pages/Login';
import { ConsultantRegistration } from './pages/ConsultantRegistration';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/apply-consultant" element={<ConsultantRegistration />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:id" element={<ProjectDetails />} />
              <Route path="approvals" element={<Projects />} />
              <Route path="approvals/:id" element={<ProjectDetails />} />
              <Route path="approvals/:id/compare" element={<BlueprintComparison />} />
              <Route path="permits" element={<BlueprintComparison />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
