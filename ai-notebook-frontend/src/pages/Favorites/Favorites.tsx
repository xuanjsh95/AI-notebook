import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Note } from '../../types';
import { noteAPI } from '../../services/api';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [noteMenuAnchor, setNoteMenuAnchor] = useState<{ element: HTMLElement; noteId: string } | null>(null);

  // 获取收藏的笔记
  useEffect(() => {
    const fetchFavoriteNotes = async () => {
      try {
        setLoading(true);
        const response = await noteAPI.getNotes({ favorite: true });
        setNotes(response.notes);
      } catch (error) {
        console.error('Failed to fetch favorite notes:', error);
        setError('获取收藏笔记失败');
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteNotes();
  }, []);

  // 过滤笔记
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content_text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNoteClick = (noteId: string) => {
    navigate(`/note/${noteId}`);
  };

  const handleNoteMenuOpen = (event: React.MouseEvent<HTMLElement>, noteId: string) => {
    event.stopPropagation();
    setNoteMenuAnchor({ element: event.currentTarget, noteId });
  };

  const handleNoteMenuClose = () => {
    setNoteMenuAnchor(null);
  };

  const handleToggleFavorite = async (noteId: string) => {
    try {
      const updatedNote = await noteAPI.toggleFavorite(noteId);
      setNotes(prev => prev.filter(note => note.id !== noteId)); // 从收藏夹中移除
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      setError('操作失败');
    }
    handleNoteMenuClose();
  };

  const handleToggleArchive = async (noteId: string) => {
    try {
      const updatedNote = await noteAPI.toggleArchive(noteId);
      setNotes(prev => prev.map(note => 
        note.id === noteId ? updatedNote : note
      ));
    } catch (error) {
      console.error('Failed to toggle archive:', error);
      setError('操作失败');
    }
    handleNoteMenuClose();
  };

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('确定要删除这篇笔记吗？')) {
      try {
        await noteAPI.deleteNote(noteId);
        setNotes(prev => prev.filter(note => note.id !== noteId));
      } catch (error) {
        console.error('Failed to delete note:', error);
        setError('删除失败');
      }
    }
    handleNoteMenuClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 页面标题 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StarIcon color="primary" />
          收藏夹
        </Typography>
        <Typography variant="body1" color="text.secondary">
          查看您收藏的所有笔记
        </Typography>
      </Box>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 搜索栏 */}
      <Box sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="搜索收藏的笔记..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
      </Box>

      {/* 笔记列表 */}
      {filteredNotes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <StarBorderIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchQuery ? '没有找到匹配的收藏笔记' : '还没有收藏任何笔记'}
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {searchQuery ? '尝试使用不同的关键词搜索' : '在笔记中点击星标图标来收藏笔记'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredNotes.map((note) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={note.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                }}
                onClick={() => handleNoteClick(note.id)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="h2" noWrap sx={{ flexGrow: 1, mr: 1 }}>
                      {note.title || '无标题'}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleNoteMenuOpen(e, note.id)}
                      sx={{ ml: 1 }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {note.excerpt || note.content_text || '暂无内容'}
                  </Typography>
                  
                  {note.tags && note.tags.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      {note.tags.slice(0, 3).map((tag, index) => (
                        <Chip key={index} label={tag} size="small" variant="outlined" />
                      ))}
                      {note.tags.length > 3 && (
                        <Chip label={`+${note.tags.length - 3}`} size="small" variant="outlined" />
                      )}
                    </Box>
                  )}
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Typography variant="caption" color="text.disabled">
                    {formatDate(note.updated_at)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StarIcon color="primary" fontSize="small" />
                    {note.is_archived && (
                      <ArchiveIcon color="action" fontSize="small" />
                    )}
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 笔记操作菜单 */}
      <Menu
        anchorEl={noteMenuAnchor?.element}
        open={Boolean(noteMenuAnchor)}
        onClose={handleNoteMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (noteMenuAnchor) {
              navigate(`/note/${noteMenuAnchor.noteId}`);
            }
            handleNoteMenuClose();
          }}
        >
          <EditIcon sx={{ mr: 1 }} />
          编辑
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (noteMenuAnchor) {
              handleToggleFavorite(noteMenuAnchor.noteId);
            }
          }}
        >
          <StarBorderIcon sx={{ mr: 1 }} />
          取消收藏
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (noteMenuAnchor) {
              handleToggleArchive(noteMenuAnchor.noteId);
            }
          }}
        >
          <ArchiveIcon sx={{ mr: 1 }} />
          {notes.find(n => n.id === noteMenuAnchor?.noteId)?.is_archived ? '取消归档' : '归档'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (noteMenuAnchor) {
              handleDeleteNote(noteMenuAnchor.noteId);
            }
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          删除
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Favorites;