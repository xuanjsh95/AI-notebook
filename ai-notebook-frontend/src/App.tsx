import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import NotebookView from './pages/Notebook/NotebookView';
import NoteEditor from './pages/Note/NoteEditor';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Settings from './pages/Settings/Settings';
import Favorites from './pages/Favorites/Favorites';
import Chat from './components/Chat/Chat';
import PomodoroTimer from './components/PomodoroTimer/PomodoroTimer';
import ProjectManagement from './components/ProjectManagement/ProjectManagement';
import { useAuth } from './hooks/useAuth';



function App() {
  const { isAuthenticated, loading } = useAuth();

  // 显示加载状态
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        加载中...
      </div>
    );
  }

  return (
    <Routes>
      {/* 认证路由 */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} 
      />
      
      {/* 主应用路由 - 需要认证 */}
      <Route path="/*" element={
        isAuthenticated ? (
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pomodoro" element={<PomodoroTimer />} />
              <Route path="/projects" element={<ProjectManagement />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/notebook/:id" element={<NotebookView />} />
              <Route path="/note/:id" element={<NoteEditor />} />
              <Route path="/note/new" element={<NoteEditor />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
    </Routes>
  );
}

export default App;
