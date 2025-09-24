import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  StarBorder as StarBorderIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  NavigateNext as NavigateNextIcon,
  AutoAwesome as AutoAwesomeIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { Note, Notebook } from '../../types';
import { noteAPI, notebookAPI } from '../../services/api';



const NotebookView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI 状态
  const [searchQuery, setSearchQuery] = useState('');
  
  // 新笔记创建状态
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [creating, setCreating] = useState(false);
  
  // 菜单状态
  const [noteMenuAnchor, setNoteMenuAnchor] = useState<{ element: HTMLElement; noteId: string } | null>(null);
  
  // 对话框状态
  const [editNotebookDialog, setEditNotebookDialog] = useState(false);
  const [notebookTitle, setNotebookTitle] = useState('');
  const [notebookDescription, setNotebookDescription] = useState('');

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const [notebookData, notesResponse] = await Promise.all([
          notebookAPI.getNotebook(id),
          noteAPI.getNotes({ notebook_id: id }),
        ]);
        
        setNotebook(notebookData);
        setNotes(notesResponse.notes);
        setNotebookTitle(notebookData.title);
        setNotebookDescription(notebookData.description || '');
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // 过滤笔记
  useEffect(() => {
    let filtered = notes.filter(note => {
      // 搜索过滤
      const matchesSearch = !searchQuery || 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (note.content_text && note.content_text.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // 只显示未归档且未删除的笔记
      return matchesSearch && !note.is_archived && !note.is_deleted;
    });
    
    // 按更新时间排序（最新的在前）
    filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    
    setFilteredNotes(filtered);
  }, [notes, searchQuery]);

  const handleSaveNote = async () => {
    if (!newNoteTitle.trim() && !newNoteContent.trim()) {
      return;
    }
    
    try {
      setCreating(true);
      const noteData = {
        title: newNoteTitle.trim() || '无标题',
        content: newNoteContent.trim(),
        notebook_id: id,
        tags: [],
        status: 'draft'
      };
      
      const newNote = await noteAPI.createNote(noteData as any);
      setNotes(prev => [newNote, ...prev]);
      
      // 清空输入框
      setNewNoteTitle('');
      setNewNoteContent('');
      } catch (error) {
        console.error('保存笔记失败:', error);
      setError('创建笔记失败');
    } finally {
      setCreating(false);
    }
  };

  const handleNoteClick = (noteId: string) => {
    navigate(`/note/${noteId}`);
  };

  const handleToggleFavorite = async (noteId?: string) => {
    // 如果是新笔记创建时的收藏操作，先保存笔记再收藏
    if (!noteId && (newNoteTitle.trim() || newNoteContent.trim())) {
      try {
        setCreating(true);
        const noteData = {
          title: newNoteTitle.trim() || '无标题',
          content: newNoteContent.trim(),
          notebook_id: id,
          tags: [],
          status: 'draft',
          is_favorite: true
        };
        
        const newNote = await noteAPI.createNote(noteData as any);
        setNotes(prev => [newNote, ...prev]);
        
        // 清空输入框
        setNewNoteTitle('');
        setNewNoteContent('');
      } catch (error) {
        console.error('保存并收藏笔记失败:', error);
        setError('保存并收藏失败');
      } finally {
        setCreating(false);
      }
      return;
    }
    
    // 现有笔记的收藏切换
    if (noteId) {
      try {
        const updatedNote = await noteAPI.toggleFavorite(noteId);
        setNotes(prev => prev.map(note => 
          note.id === noteId ? updatedNote : note
        ));
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
        setError('操作失败');
      }
    }
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
  };

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('确定要删除这篇笔记吗？此操作无法撤销。')) {
      try {
        await noteAPI.deleteNote(noteId);
        setNotes(prev => prev.filter(note => note.id !== noteId));
      } catch (error) {
        console.error('Failed to delete note:', error);
        setError('删除失败');
      }
    }
  };

  const handleUpdateNotebook = async () => {
    if (!notebook) return;
    
    try {
      const updatedNotebook = await notebookAPI.updateNotebook(notebook.id, {
        title: notebookTitle,
        description: notebookDescription,
      });
      setNotebook(updatedNotebook);
      setEditNotebookDialog(false);
    } catch (error) {
      console.error('Failed to update notebook:', error);
      setError('更新失败');
    }
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!notebook) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">笔记本不存在</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 面包屑导航 */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link component={RouterLink} to="/dashboard" underline="hover">
            首页
          </Link>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography color="text.primary">{notebook.title}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ 
              backgroundColor: 'action.hover', 
              px: 1, 
              py: 0.25, 
              borderRadius: 1,
              fontSize: '0.75rem'
            }}>
              {notes.length} 篇笔记
            </Typography>
          </Box>
        </Breadcrumbs>
      </Box>



      {/* 错误提示 */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* 主编辑区域 */}
      <Box sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          flexGrow: 1, 
          border: '1px solid', 
          borderColor: 'divider', 
          borderRadius: 1, 
          p: 3,
          backgroundColor: 'background.paper',
          minHeight: '200px',
          maxHeight: '300px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 标题输入框 */}
          <TextField
            fullWidth
            variant="standard"
            placeholder="输入标题..."
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && (newNoteTitle.trim() || newNoteContent.trim())) {
                handleSaveNote();
              }
            }}
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: '1.5rem',
                fontWeight: 600,
                mb: 2,
              },
            }}
            disabled={creating}
          />
          
          {/* 内容输入框容器 */}
          <Box sx={{ position: 'relative', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {/* 内容输入框 */}
            <TextField
              fullWidth
              multiline
              variant="standard"
              placeholder="开始写下你的想法..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.ctrlKey && (newNoteTitle.trim() || newNoteContent.trim())) {
                  handleSaveNote();
                }
              }}
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: '1rem',
                  lineHeight: 1.6,
                },
              }}
              sx={{
                flexGrow: 1,
                '& .MuiInputBase-root': {
                  height: '100%',
                  alignItems: 'flex-start',
                },
                '& .MuiInputBase-input': {
                  height: '100% !important',
                  overflow: 'auto !important',
                },
              }}
              disabled={creating}
            />
            
            {/* 浮动工具栏 */}
            {(newNoteTitle.trim() || newNoteContent.trim()) && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  display: 'flex',
                  gap: 1,
                  backgroundColor: 'background.paper',
                  borderRadius: 2,
                  boxShadow: 2,
                  p: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<AutoAwesomeIcon />}
                  disabled={!newNoteContent.trim()}
                  size="small"
                >
                  总结
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<AutoAwesomeIcon />}
                  disabled={!newNoteContent.trim()}
                  size="small"
                >
                  润色
                </Button>
                
                <IconButton 
                  size="small"
                  onClick={() => handleToggleFavorite()}
                  disabled={!newNoteTitle.trim() && !newNoteContent.trim()}
                >
                  <StarBorderIcon />
                </IconButton>

                <Button
                  variant="contained"
                  startIcon={creating ? <CircularProgress size={16} /> : <SaveIcon />}
                  onClick={handleSaveNote}
                  disabled={creating}
                  size="small"
                >
                  {creating ? '保存中...' : '保存'}
                </Button>
              </Box>
            )}
          </Box>
          

        </Box>
      </Box>

      {/* 底部搜索和历史笔记区域 */}
      <Box sx={{ 
        borderTop: '1px solid', 
        borderColor: 'divider', 
        backgroundColor: 'background.default',
        maxHeight: '300px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 搜索栏 */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="搜索历史笔记..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        {/* 历史笔记列表 */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
          {filteredNotes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                {notes.length === 0 ? '还没有笔记' : '没有找到匹配的笔记'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {filteredNotes.slice(0, 10).map((note) => (
                <Card 
                  key={note.id}
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                  onClick={() => handleNoteClick(note.id)}
                >
                  <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap sx={{ mb: 0.5 }}>
                          {note.title || '无标题'}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {note.content_text || note.content || '暂无内容'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                        <Typography variant="caption" color="text.disabled">
                          {formatDate(note.updated_at)}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNoteMenuAnchor({ element: e.currentTarget, noteId: note.id });
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* 笔记操作菜单 */}
      <Menu
        anchorEl={noteMenuAnchor?.element}
        open={Boolean(noteMenuAnchor)}
        onClose={() => setNoteMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            if (noteMenuAnchor) {
              handleToggleFavorite(noteMenuAnchor.noteId);
            }
            setNoteMenuAnchor(null);
          }}
        >
          <StarBorderIcon sx={{ mr: 1 }} />
          {notes.find(n => n.id === noteMenuAnchor?.noteId)?.is_favorite ? '取消收藏' : '收藏'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (noteMenuAnchor) {
              handleToggleArchive(noteMenuAnchor.noteId);
            }
            setNoteMenuAnchor(null);
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
            setNoteMenuAnchor(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          删除
        </MenuItem>
      </Menu>



      {/* 编辑笔记本对话框 */}
      <Dialog open={editNotebookDialog} onClose={() => setEditNotebookDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>编辑笔记本</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="标题"
            value={notebookTitle}
            onChange={(e) => setNotebookTitle(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            label="描述"
            multiline
            rows={3}
            value={notebookDescription}
            onChange={(e) => setNotebookDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditNotebookDialog(false)}>取消</Button>
          <Button onClick={handleUpdateNotebook} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotebookView;