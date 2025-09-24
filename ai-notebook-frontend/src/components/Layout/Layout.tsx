import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import { User } from '../../types';
import { authAPI } from '../../services/api';

interface LayoutProps {
  children: React.ReactNode;
}

const DRAWER_WIDTH = 280;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 获取当前用户信息
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // 如果获取用户信息失败，可能需要重新登录
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Typography>加载中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* 应用栏 */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Header
          onMenuClick={handleDrawerToggle}
          user={user}
          showMenuButton={isMobile}
        />
      </AppBar>

      {/* 侧边栏 */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* 移动端抽屉 */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // 更好的移动端性能
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 255, 0.95) 100%)',
              backdropFilter: 'blur(10px)',
              borderRight: '1px solid rgba(0, 0, 0, 0.06)',
            },
          }}
        >
          <Sidebar user={user} onClose={() => setMobileOpen(false)} />
        </Drawer>

        {/* 桌面端固定侧边栏 */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              bgcolor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              borderRight: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.05)',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 255, 0.95) 100%)',
            },
          }}
          open
        >
          <Sidebar user={user} />
        </Drawer>
      </Box>

      {/* 主内容区域 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px', // AppBar 高度
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;