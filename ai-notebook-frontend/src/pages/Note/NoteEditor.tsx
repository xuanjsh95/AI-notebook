import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  AutoAwesome as AIIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { Note } from '../../types';
import { noteAPI, aiAPI } from '../../services/api';

const NoteEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNewNote = id === 'new' || !id;

  const [note, setNote] = useState<Partial<Note>>({
    title: '',
    content: '',
    notebook_id: '',
    tags: [],
    is_favorite: false,
    is_archived: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // 获取笔记数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 获取当前笔记本ID（从URL参数或localStorage获取）
        const currentNotebookId = localStorage.getItem('currentNotebookId') || '';

        // 如果是编辑现有笔记
        if (!isNewNote && id) {
          const noteData = await noteAPI.getNote(id);
          setNote(noteData);
        } else {
          // 新笔记默认添加到当前打开的笔记本
          setNote(prev => ({ ...prev, notebook_id: currentNotebookId }));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isNewNote]);

  // 自动保存
  useEffect(() => {
    if (!isNewNote && note.id && (note.title || note.content)) {
      const timer = setTimeout(() => {
        handleSave(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [note.title, note.content, isNewNote, note.id]);

  const handleSave = async (silent = false) => {
    if (!note.title && !note.content) {
      if (!silent) {
        setError('请输入标题或内容');
      }
      return;
    }

    try {
      if (!silent) setSaving(true);
      
      const noteData = {
        ...note,
      };

      let savedNote;
      if (isNewNote) {
        savedNote = await noteAPI.createNote(noteData as any);
        // 保存成功后跳转到笔记本页面
        const notebookId = note.notebook_id || localStorage.getItem('currentNotebookId');
        if (notebookId) {
          navigate(`/notebook/${notebookId}`, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        savedNote = await noteAPI.updateNote(note.id!, noteData);
      }

      setNote(savedNote);
      if (!silent) {
        // 显示保存成功提示
        console.log('Note saved successfully');
      }
    } catch (error) {
      console.error('Failed to save note:', error);
      if (!silent) {
        setError('保存失败，请重试');
      }
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!note.id) return;
    
    try {
      const updatedNote = await noteAPI.toggleFavorite(note.id);
      setNote(updatedNote);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      setError('操作失败');
    }
  };

  const handleToggleArchive = async () => {
    if (!note.id) return;
    
    try {
      const updatedNote = await noteAPI.toggleArchive(note.id);
      setNote(updatedNote);
    } catch (error) {
      console.error('Failed to toggle archive:', error);
      setError('操作失败');
    }
  };

  const handleDelete = async () => {
    if (!note.id) return;
    
    if (window.confirm('确定要删除这篇笔记吗？此操作无法撤销。')) {
      try {
        await noteAPI.deleteNote(note.id);
        navigate('/dashboard');
      } catch (error) {
        console.error('Failed to delete note:', error);
        setError('删除失败');
      }
    }
  };

  const handleAISummarize = async () => {
    if (!note.content?.trim()) {
      setError('请先输入内容再进行总结');
      return;
    }
    
    try {
      setAiLoading(true);
      const summary = await aiAPI.analyze(note.content);
      
      // 将总结内容添加到笔记末尾
      setNote(prev => ({
        ...prev,
        content: (prev.content || '') + '\n\n## AI总结\n' + (summary.summary || '总结生成失败'),
      }));
    } catch (error) {
      console.error('AI summarize failed:', error);
      setError('AI 总结失败');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIPolish = async () => {
    if (!note.content?.trim()) {
      setError('请先输入内容再进行润色');
      return;
    }
    
    try {
      setAiLoading(true);
      const polished = await aiAPI.complete('请润色以下内容，使其更加流畅和专业：', note.content);
      
      // 替换当前内容为润色后的内容
      setNote(prev => ({
        ...prev,
        content: polished.completion || '润色失败',
      }));
    } catch (error) {
      console.error('AI polish failed:', error);
      setError('AI 润色失败');
    } finally {
      setAiLoading(false);
    }
  };



  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 工具栏 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">
            {isNewNote ? '新建笔记' : '编辑笔记'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Box>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* 编辑区域 */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
        {/* 标题 */}
        <TextField
          fullWidth
          variant="standard"
          placeholder="输入标题..."
          value={note.title || ''}
          onChange={(e) => setNote(prev => ({ ...prev, title: e.target.value }))}
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: '2rem',
              fontWeight: 600,
              mb: 2,
            },
          }}
        />





        {/* 内容编辑器容器 */}
        <Box sx={{ position: 'relative', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* 内容编辑器 */}
          <TextField
            fullWidth
            multiline
            variant="standard"
            placeholder="开始写作..."
            value={note.content || ''}
            onChange={(e) => setNote(prev => ({ ...prev, content: e.target.value }))}
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
          />
          
          {/* 浮动工具栏 */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
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
              startIcon={aiLoading ? <CircularProgress size={16} /> : <AIIcon />}
              onClick={() => handleAISummarize()}
              disabled={aiLoading || !note.content?.trim()}
              size="small"
            >
              总结
            </Button>
            
            <Button
              variant="outlined"
              startIcon={aiLoading ? <CircularProgress size={16} /> : <AIIcon />}
              onClick={() => handleAIPolish()}
              disabled={aiLoading || !note.content?.trim()}
              size="small"
            >
              润色
            </Button>
            
            <Tooltip title={note.is_favorite ? '取消收藏' : '收藏'}>
              <IconButton onClick={handleToggleFavorite} size="small">
                {note.is_favorite ? <StarIcon color="warning" /> : <StarBorderIcon />}
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => handleSave()}
              disabled={saving}
              size="small"
            >
              保存
            </Button>
          </Box>
        </Box>
      </Box>

      {/* 操作菜单 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleToggleArchive(); handleMenuClose(); }}>
          <ArchiveIcon sx={{ mr: 1 }} />
          {note.is_archived ? '取消归档' : '归档'}
        </MenuItem>
        <MenuItem onClick={() => { /* TODO: 实现分享功能 */ handleMenuClose(); }}>
          <ShareIcon sx={{ mr: 1 }} />
          分享
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleDelete(); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          删除
        </MenuItem>
      </Menu>


    </Box>
  );
};

export default NoteEditor;