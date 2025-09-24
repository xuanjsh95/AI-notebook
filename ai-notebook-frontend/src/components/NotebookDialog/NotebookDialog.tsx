import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Notebook } from '../../types';
import { notebookAPI } from '../../services/api';

interface NotebookDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (notebook: Notebook) => void;
  notebook?: Notebook; // 如果提供则为编辑模式
}

const colorOptions = [
  '#1890ff', '#52c41a', '#faad14', '#f5222d',
  '#722ed1', '#13c2c2', '#eb2f96', '#fa541c',
  '#2f54eb', '#a0d911', '#fadb14', '#ff4d4f',
];

const NotebookDialog: React.FC<NotebookDialogProps> = ({
  open,
  onClose,
  onSuccess,
  notebook,
}) => {
  const isEdit = !!notebook;
  const [title, setTitle] = useState(notebook?.title || '');
  const [description, setDescription] = useState(notebook?.description || '');
  const [selectedColor, setSelectedColor] = useState(notebook?.color || colorOptions[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('请输入笔记本标题');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const notebookData = {
        title: title.trim(),
        description: description.trim(),
        color: selectedColor,
        is_shared: false,
      };

      let result: Notebook;
      if (isEdit) {
        result = await notebookAPI.updateNotebook(notebook.id, notebookData);
      } else {
        result = await notebookAPI.createNotebook(notebookData);
      }

      onSuccess(result);
      handleClose();
    } catch (error: any) {
      console.error('Failed to save notebook:', error);
      setError(error.response?.data?.message || '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle(notebook?.title || '');
      setDescription(notebook?.description || '');
      setSelectedColor(notebook?.color || colorOptions[0]);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? '编辑笔记本' : '创建笔记本'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <TextField
          fullWidth
          label="标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
          disabled={loading}
          autoFocus
        />
        
        <TextField
          fullWidth
          label="描述（可选）"
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 3 }}
          disabled={loading}
        />
        
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            选择颜色
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {colorOptions.map((color) => (
              <Paper
                key={color}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: color,
                  cursor: 'pointer',
                  border: selectedColor === color ? '3px solid' : '1px solid',
                  borderColor: selectedColor === color ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !title.trim()}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? '保存中...' : (isEdit ? '保存' : '创建')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotebookDialog;