import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Collapse,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Book as BookIcon,
  Star as StarIcon,
  Archive as ArchiveIcon,
  Add as AddIcon,
  ExpandLess,
  ExpandMore,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon,
  Timer as TimerIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Notebook } from '../../types';
import { notebookAPI } from '../../services/api';
import NotebookDialog from '../NotebookDialog/NotebookDialog';

interface SidebarProps {
  user: User | null;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [notebooksExpanded, setNotebooksExpanded] = useState(true);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null);
  const [notebookDialogOpen, setNotebookDialogOpen] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);

  // 获取笔记本列表
  useEffect(() => {
    const fetchNotebooks = async () => {
      try {
        const data = await notebookAPI.getNotebooks();
        setNotebooks(data);
      } catch (error) {
        console.error('Failed to fetch notebooks:', error);
      }
    };

    fetchNotebooks();
  }, []);



  const handleNavigation = (path: string) => {
    navigate(path);
    onClose?.();
  };

  const handleNotebookMenuOpen = (event: React.MouseEvent<HTMLElement>, notebookId: string) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedNotebook(notebookId);
  };

  const handleNotebookMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedNotebook(null);
  };

  const handleCreateNotebook = () => {
    setEditingNotebook(null);
    setNotebookDialogOpen(true);
  };

  const handleEditNotebook = () => {
    if (selectedNotebook) {
      const notebook = notebooks.find(nb => nb.id === selectedNotebook);
      if (notebook) {
        setEditingNotebook(notebook);
        setNotebookDialogOpen(true);
      }
    }
    handleNotebookMenuClose();
  };

  const handleNotebookSaved = async (savedNotebook: Notebook) => {
    try {
      // 重新获取最新的笔记本列表以确保数据同步
      const updatedNotebooks = await notebookAPI.getNotebooks();
      setNotebooks(updatedNotebooks);
    } catch (error) {
      console.error('Failed to refresh notebooks:', error);
      // 如果获取失败，仍然使用本地状态更新
      if (editingNotebook) {
        // 编辑模式
        setNotebooks(prev => prev.map(nb => nb.id === savedNotebook.id ? savedNotebook : nb));
      } else {
        // 创建模式
        setNotebooks(prev => [...prev, savedNotebook]);
      }
    }
    // 重置状态并关闭对话框
    setEditingNotebook(null);
    setNotebookDialogOpen(false);
  };

  const handleDeleteNotebook = async () => {
    if (selectedNotebook) {
      try {
        await notebookAPI.deleteNotebook(selectedNotebook);
        setNotebooks(notebooks.filter(nb => nb.id !== selectedNotebook));
      } catch (error) {
        console.error('Failed to delete notebook:', error);
      }
    }
    handleNotebookMenuClose();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      text: '任务清单',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: '番茄钟',
      icon: <TimerIcon />,
      path: '/pomodoro',
    },
    {
      text: '项目管理',
      icon: <AssignmentIcon />,
      path: '/projects',
    },
    {
      text: 'AI对话',
      icon: <ChatIcon />,
      path: '/chat',
    },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 用户信息区域 */}
      <Box sx={{ 
        p: 2.5, 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.1) 100%)',
      }}>
        <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ letterSpacing: '0.5px' }}>
          AI 记事本
        </Typography>
        {user && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, opacity: 0.85 }}>
            欢迎回来，{user.username}
          </Typography>
        )}
      </Box>

      {/* 主导航 */}
      <List sx={{ px: 2, py: 1.5 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                py: 1.2,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
                '&:hover:not(.Mui-selected)': {
                  bgcolor: 'rgba(25, 118, 210, 0.08)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: isActive(item.path) ? 'inherit' : 'primary.main' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontWeight: isActive(item.path) ? 600 : 500,
                  fontSize: '0.95rem',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mx: 2, my: 1.5 }} />

      {/* 笔记本部分 */}
      <Box sx={{ px: 2, py: 1 }}>
        <ListItemButton
          onClick={() => setNotebooksExpanded(!notebooksExpanded)}
          sx={{ 
            borderRadius: 2, 
            mb: 1.5,
            py: 1,
            bgcolor: 'rgba(25, 118, 210, 0.04)',
            '&:hover': {
              bgcolor: 'rgba(25, 118, 210, 0.08)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
            <BookIcon />
          </ListItemIcon>
          <ListItemText 
            primary="笔记本" 
            primaryTypographyProps={{ 
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          />
          <IconButton 
            size="small" 
            onClick={handleCreateNotebook}
            sx={{ 
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'rgba(25, 118, 210, 0.15)',
              },
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
          {notebooksExpanded ? <ExpandLess color="primary" /> : <ExpandMore color="primary" />}
        </ListItemButton>

        <Collapse in={notebooksExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ ml: 1, mt: 1 }}>
            {/* 收藏夹选项 */}
            <ListItem disablePadding sx={{ mb: 0.8 }}>
              <ListItemButton
                selected={location.pathname === '/favorites'}
                onClick={() => handleNavigation('/favorites')}
                sx={{
                  pl: 3,
                  py: 0.8,
                  borderRadius: 1.5,
                  transition: 'all 0.2s ease',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.2)',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                  '&:hover:not(.Mui-selected)': {
                    bgcolor: 'rgba(25, 118, 210, 0.06)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: location.pathname === '/favorites' ? 'inherit' : 'warning.main' }}>
                  <StarIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="收藏夹" 
                  primaryTypographyProps={{ 
                    fontWeight: location.pathname === '/favorites' ? 600 : 500,
                    fontSize: '0.9rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
            
            {/* 笔记本列表 */}
            {notebooks.map((notebook) => (
              <ListItem key={notebook.id} disablePadding sx={{ mb: 0.8 }}>
                <ListItemButton
                  selected={location.pathname === `/notebook/${notebook.id}`}
                  onClick={() => handleNavigation(`/notebook/${notebook.id}`)}
                  sx={{
                    pl: 3,
                    py: 0.8,
                    borderRadius: 1.5,
                    transition: 'all 0.2s ease',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.2)',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                    '&:hover:not(.Mui-selected)': {
                      bgcolor: 'rgba(25, 118, 210, 0.06)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: notebook.color || 'primary.main',
                        boxShadow: `0 0 0 2px ${location.pathname === `/notebook/${notebook.id}` ? '#fff' : 'rgba(255,255,255,0.5)'}`,
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={notebook.title}
                    secondary={notebook.note_count ? `${notebook.note_count} 篇笔记` : '空'}
                    primaryTypographyProps={{ 
                      fontWeight: location.pathname === `/notebook/${notebook.id}` ? 600 : 500,
                      fontSize: '0.9rem',
                    }}
                    secondaryTypographyProps={{ 
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => handleNotebookMenuOpen(e, notebook.id)}
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </ListItemButton>
              </ListItem>
            ))}
            {notebooks.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="暂无笔记本"
                  secondary="点击 + 创建第一个笔记本"
                  sx={{ 
                    pl: 3, 
                    py: 1,
                    color: 'text.secondary',
                    bgcolor: 'rgba(0, 0, 0, 0.02)',
                    borderRadius: 1.5,
                  }}
                  primaryTypographyProps={{ 
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                  secondaryTypographyProps={{ 
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                  }}
                />
              </ListItem>
            )}
          </List>
        </Collapse>
      </Box>

      {/* 底部设置 */}
      <Box sx={{ 
        p: 2, 
        mt: 'auto', 
        borderTop: '1px solid', 
        borderColor: 'divider',
        background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.02) 0%, rgba(25, 118, 210, 0.05) 100%)',
      }}>
        <ListItemButton
          onClick={() => handleNavigation('/settings')}
          sx={{ 
            borderRadius: 2,
            py: 1,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'rgba(25, 118, 210, 0.08)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText 
            primary="设置" 
            primaryTypographyProps={{ 
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          />
        </ListItemButton>
      </Box>

      {/* 笔记本操作菜单 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleNotebookMenuClose}
        PaperProps={{
          sx: {
            minWidth: 150,
          },
        }}
      >
        <MenuItem onClick={handleEditNotebook}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>编辑</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteNotebook} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>删除</ListItemText>
        </MenuItem>
      </Menu>

      {/* 笔记本创建/编辑对话框 */}
       <NotebookDialog
         open={notebookDialogOpen}
         onClose={() => {
           setNotebookDialogOpen(false);
           setEditingNotebook(null);
         }}
         onSuccess={handleNotebookSaved}
         notebook={editingNotebook || undefined}
       />
    </Box>
  );
};

export default Sidebar;