import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
} from '@mui/icons-material';
// import { useNavigate } from 'react-router-dom';

// 任务数据结构
interface Task {
  id: string;
  title: string;
  description?: string;
  isImportant: boolean;
  isUrgent: boolean;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const Dashboard: React.FC = () => {
  // const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    isImportant: false,
    isUrgent: false,
  });

  // 从localStorage加载任务
  const loadTasks = () => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      }));
      setTasks(parsedTasks);
    }
  };

  // 保存任务到localStorage
  const saveTasks = (updatedTasks: Task[]) => {
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
  };

  // 创建新任务
  const handleCreateTask = () => {
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      isImportant: newTask.isImportant,
      isUrgent: newTask.isUrgent,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedTasks = [...tasks, task];
    saveTasks(updatedTasks);
    setDialogOpen(false);
    setNewTask({ title: '', description: '', isImportant: false, isUrgent: false });
  };

  // 编辑任务
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
      isImportant: task.isImportant,
      isUrgent: task.isUrgent,
    });
    setDialogOpen(true);
  };

  // 更新任务
  const handleUpdateTask = () => {
    if (!editingTask || !newTask.title.trim()) return;

    const updatedTasks = tasks.map(task =>
      task.id === editingTask.id
        ? {
            ...task,
            title: newTask.title,
            description: newTask.description,
            isImportant: newTask.isImportant,
            isUrgent: newTask.isUrgent,
            updatedAt: new Date(),
          }
        : task
    );

    saveTasks(updatedTasks);
    setDialogOpen(false);
    setEditingTask(null);
    setNewTask({ title: '', description: '', isImportant: false, isUrgent: false });
  };

  // 删除任务
  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    saveTasks(updatedTasks);
  };

  // 切换任务完成状态
  const handleToggleComplete = (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId
        ? { ...task, completed: !task.completed, updatedAt: new Date() }
        : task
    );
    saveTasks(updatedTasks);
  };

  // 关闭对话框
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTask(null);
    setNewTask({ title: '', description: '', isImportant: false, isUrgent: false });
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // 按四象限分类任务
  const getTasksByQuadrant = () => {
    return {
      urgent_important: tasks.filter(task => task.isUrgent && task.isImportant),
      urgent_not_important: tasks.filter(task => task.isUrgent && !task.isImportant),
      not_urgent_important: tasks.filter(task => !task.isUrgent && task.isImportant),
      not_urgent_not_important: tasks.filter(task => !task.isUrgent && !task.isImportant),
    };
  };

  const quadrants = getTasksByQuadrant();

  // 渲染任务项
  const renderTask = (task: Task) => (
    <ListItem key={task.id} sx={{ px: 1, py: 0.5 }}>
      <Checkbox
        checked={task.completed}
        onChange={() => handleToggleComplete(task.id)}
        icon={<RadioButtonUncheckedIcon />}
        checkedIcon={<CheckCircleIcon />}
        sx={{ mr: 1 }}
      />
      <ListItemText
        primary={
          <Typography
            variant="body2"
            sx={{
              textDecoration: task.completed ? 'line-through' : 'none',
              opacity: task.completed ? 0.6 : 1,
            }}
          >
            {task.title}
          </Typography>
        }
        secondary={
          task.description && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                textDecoration: task.completed ? 'line-through' : 'none',
                opacity: task.completed ? 0.6 : 1,
              }}
            >
              {task.description}
            </Typography>
          )
        }
      />
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <IconButton
          size="small"
          onClick={() => handleEditTask(task)}
          sx={{ opacity: 0.7 }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleDeleteTask(task.id)}
          sx={{ opacity: 0.7 }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </ListItem>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          任务清单
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          添加任务
        </Button>
      </Box>

      {/* 四象限布局 */}
      <Grid container spacing={2} sx={{ height: 'calc(100vh - 200px)' }}>
        {/* 第一象限：重要且紧急 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', bgcolor: '#ffebee' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600} color="error.main">
                  重要且紧急
                </Typography>
                <Chip
                  label={quadrants.urgent_important.length}
                  size="small"
                  color="error"
                  sx={{ ml: 1 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                立即处理的任务
              </Typography>
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <List dense>
                  {quadrants.urgent_important.map(renderTask)}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 第二象限：重要但不紧急 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', bgcolor: '#e8f5e8' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600} color="success.main">
                  重要但不紧急
                </Typography>
                <Chip
                  label={quadrants.not_urgent_important.length}
                  size="small"
                  color="success"
                  sx={{ ml: 1 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                计划安排的任务
              </Typography>
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <List dense>
                  {quadrants.not_urgent_important.map(renderTask)}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 第三象限：紧急但不重要 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', bgcolor: '#fff3e0' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600} color="warning.main">
                  紧急但不重要
                </Typography>
                <Chip
                  label={quadrants.urgent_not_important.length}
                  size="small"
                  color="warning"
                  sx={{ ml: 1 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                委托他人的任务
              </Typography>
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <List dense>
                  {quadrants.urgent_not_important.map(renderTask)}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 第四象限：不重要且不紧急 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', bgcolor: '#f3e5f5' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600} color="secondary.main">
                  不重要且不紧急
                </Typography>
                <Chip
                  label={quadrants.not_urgent_not_important.length}
                  size="small"
                  color="secondary"
                  sx={{ ml: 1 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                有时间再做的任务
              </Typography>
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <List dense>
                  {quadrants.not_urgent_not_important.map(renderTask)}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 任务创建/编辑对话框 */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTask ? '编辑任务' : '创建新任务'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="任务标题"
            fullWidth
            variant="outlined"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="任务描述"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 120 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox
                  checked={newTask.isImportant}
                  onChange={(e) => setNewTask({ ...newTask, isImportant: e.target.checked })}
                />
                <Typography>重要</Typography>
              </Box>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox
                  checked={newTask.isUrgent}
                  onChange={(e) => setNewTask({ ...newTask, isUrgent: e.target.checked })}
                />
                <Typography>紧急</Typography>
              </Box>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button
            onClick={editingTask ? handleUpdateTask : handleCreateTask}
            variant="contained"
          >
            {editingTask ? '更新' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;