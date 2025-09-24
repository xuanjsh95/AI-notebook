import React, { useState } from 'react';
import {
  Toolbar,
  Typography,
  IconButton,
  InputBase,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onMenuClick: () => void;
  user: User | null;
  showMenuButton?: boolean;
}

// 搜索框样式
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.black, 0.05),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.black, 0.08),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    [theme.breakpoints.up('sm')]: {
      width: '20ch',
      '&:focus': {
        width: '30ch',
      },
    },
  },
}));

const Header: React.FC<HeaderProps> = ({ onMenuClick, user, showMenuButton = true }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [searchValue, setSearchValue] = useState('');

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      // 强制刷新页面以清除所有状态
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
      // 强制导航到登录页面
      navigate('/login');
      window.location.reload();
    }
    handleProfileMenuClose();
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  };

  const isMenuOpen = Boolean(anchorEl);
  const isNotificationMenuOpen = Boolean(notificationAnchorEl);

  return (
    <>
      <Toolbar>
        {/* 菜单按钮 (移动端) */}
        {showMenuButton && (
          <IconButton
            color="inherit"
            aria-label="打开菜单"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* 标题 */}
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            display: { xs: 'none', sm: 'block' },
            fontWeight: 600,
            color: 'primary.main',
          }}
        >
          AI 记事本
        </Typography>

        {/* 搜索框 */}
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <form onSubmit={handleSearch}>
              <StyledInputBase
                placeholder="搜索笔记、笔记本..."
                inputProps={{ 'aria-label': 'search' }}
                value={searchValue}
                onChange={handleSearchChange}
              />
            </form>
          </Search>
        </Box>

        {/* 右侧操作区域 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* 通知按钮 */}
          <IconButton
            size="large"
            aria-label="通知"
            color="inherit"
            onClick={handleNotificationMenuOpen}
          >
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* 用户头像和菜单 */}
          <IconButton
            size="large"
            edge="end"
            aria-label="用户菜单"
            aria-controls={isMenuOpen ? 'primary-search-account-menu' : undefined}
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            {user?.avatar ? (
              <Avatar
                src={user.avatar}
                alt={user.username}
                sx={{ width: 32, height: 32 }}
              />
            ) : (
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            )}
          </IconButton>
        </Box>
      </Toolbar>

      {/* 用户菜单 */}
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        id="primary-search-account-menu"
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={isMenuOpen}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {user?.username || '用户'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            navigate('/profile');
            handleProfileMenuClose();
          }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>个人资料</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate('/settings');
            handleProfileMenuClose();
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>设置</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>退出登录</ListItemText>
        </MenuItem>
      </Menu>

      {/* 通知菜单 */}
      <Menu
        anchorEl={notificationAnchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={isNotificationMenuOpen}
        onClose={handleNotificationMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 300,
            maxHeight: 400,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            通知
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleNotificationMenuClose}>
          <ListItemText
            primary="欢迎使用 AI 记事本"
            secondary="开始创建您的第一个笔记吧！"
          />
        </MenuItem>
        <MenuItem onClick={handleNotificationMenuClose}>
          <ListItemText
            primary="AI 功能已启用"
            secondary="您可以使用 AI 来辅助写作和分析内容"
          />
        </MenuItem>
        <MenuItem onClick={handleNotificationMenuClose}>
          <ListItemText
            primary="系统更新"
            secondary="新增了标签管理功能"
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default Header;