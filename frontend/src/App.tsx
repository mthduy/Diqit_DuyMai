import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import DashBoardPage from '../pages/DashBoard/DashBoardPage';
import ProfilePage from '../pages/Profile/ProfilePage';
import { Toaster } from 'sonner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import BoardPage from '../pages/Board/BoardPage';
import NotFound from '../pages/NotFound';
import PublicRoute from './components/auth/PublicRoute';
function App() {
  return (
    <>
      <Toaster richColors />
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashBoardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/board/:id" element={<BoardPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
