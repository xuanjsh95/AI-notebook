import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Divider,
  Chip,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

// 项目类型定义
interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in-progress' | 'completed';
  startDate: string;
  endDate: string;
  tasks: Task[];
}

// 任务类型定义
interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
}

// 模拟API服务
const projectAPI = {
  getProjects: async (): Promise<Project[]> => {
    // 从localStorage获取项目数据，如果没有则返回空数组
    const projects = localStorage.getItem('projects');
    return projects ? JSON.parse(projects) : [];
  },
  
  createProject: async (project: Omit<Project, 'id'>): Promise<Project> => {
    const projects = await projectAPI.getProjects();
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      tasks: [],
    };
    localStorage.setItem('projects', JSON.stringify([...projects, newProject]));
    return newProject;
  },
  
  updateProject: async (project: Project): Promise<Project> => {
    const projects = await projectAPI.getProjects();
    const updatedProjects = projects.map(p => p.id === project.id ? project : p);
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
    return project;
  },
  
  deleteProject: async (projectId: string): Promise<void> => {
    const projects = await projectAPI.getProjects();
    const filteredProjects = projects.filter(p => p.id !== projectId);
    localStorage.setItem('projects', JSON.stringify(filteredProjects));
  },
  
  createTask: async (task: Omit<Task, 'id'>): Promise<Task> => {
    const projects = await projectAPI.getProjects();
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
    };
    
    const updatedProjects = projects.map(project => {
      if (project.id === task.projectId) {
        return {
          ...project,
          tasks: [...project.tasks, newTask],
        };
      }
      return project;
    });
    
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
    return newTask;
  },
  
  updateTask: async (task: Task): Promise<Task> => {
    const projects = await projectAPI.getProjects();
    const updatedProjects = projects.map(project => {
      if (project.id === task.projectId) {
        return {
          ...project,
          tasks: project.tasks.map(t => t.id === task.id ? task : t),
        };
      }
      return project;
    });
    
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
    return task;
  },
  
  deleteTask: async (projectId: string, taskId: string): Promise<void> => {
    const projects = await projectAPI.getProjects();
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          tasks: project.tasks.filter(t => t.id !== taskId),
        };
      }
      return project;
    });
    
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
  },
};

// 项目表单组件
interface ProjectFormProps {
  project?: Project;
  onSave: (project: Omit<Project, 'id' | 'tasks'>) => void;
  onCancel: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSave, onCancel }) => {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [status, setStatus] = useState<'planning' | 'in-progress' | 'completed'>(project?.status || 'planning');
  const [startDate, setStartDate] = useState(project?.startDate || '');
  const [endDate, setEndDate] = useState(project?.endDate || '');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      status,
      startDate,
      endDate,
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="项目名称"
            type="text"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="项目描述"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>状态</InputLabel>
            <Select
              value={status}
              label="状态"
              onChange={(e) => setStatus(e.target.value as 'planning' | 'in-progress' | 'completed')}
            >
              <MenuItem value="planning">规划中</MenuItem>
              <MenuItem value="in-progress">进行中</MenuItem>
              <MenuItem value="completed">已完成</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                margin="dense"
                label="开始日期"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                margin="dense"
                label="结束日期"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>取消</Button>
        <Button type="submit" variant="contained" color="primary">保存</Button>
      </DialogActions>
    </form>
  );
};

// 任务表单组件
interface TaskFormProps {
  projectId: string;
  task?: Task;
  onSave: (task: Omit<Task, 'id'>) => void;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ projectId, task, onSave, onCancel }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<'todo' | 'in-progress' | 'completed'>(task?.status || 'todo');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      projectId,
      title,
      description,
      status,
      priority,
      dueDate,
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="任务标题"
            type="text"
            fullWidth
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            margin="dense"
            label="任务描述"
            type="text"
            fullWidth
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth margin="dense">
                <InputLabel>状态</InputLabel>
                <Select
                  value={status}
                  label="状态"
                  onChange={(e) => setStatus(e.target.value as 'todo' | 'in-progress' | 'completed')}
                >
                  <MenuItem value="todo">待办</MenuItem>
                  <MenuItem value="in-progress">进行中</MenuItem>
                  <MenuItem value="completed">已完成</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth margin="dense">
                <InputLabel>优先级</InputLabel>
                <Select
                  value={priority}
                  label="优先级"
                  onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                >
                  <MenuItem value="low">低</MenuItem>
                  <MenuItem value="medium">中</MenuItem>
                  <MenuItem value="high">高</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          <TextField
            margin="dense"
            label="截止日期"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>取消</Button>
        <Button type="submit" variant="contained" color="primary">保存</Button>
      </DialogActions>
    </form>
  );
};

// 项目卡片组件
interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onSelect: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete, onSelect }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'info';
      case 'in-progress': return 'warning';
      case 'completed': return 'success';
      default: return 'default';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'planning': return '规划中';
      case 'in-progress': return '进行中';
      case 'completed': return '已完成';
      default: return status;
    }
  };
  
  const completedTasks = project.tasks.filter(task => task.status === 'completed').length;
  const totalTasks = project.tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="div" gutterBottom>
          {project.name}
        </Typography>
        <Chip 
          label={getStatusText(project.status)} 
          color={getStatusColor(project.status) as any} 
          size="small" 
          sx={{ mb: 1 }} 
        />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {project.description}
        </Typography>
        <Typography variant="body2">
          开始: {project.startDate || '未设置'}
        </Typography>
        <Typography variant="body2">
          结束: {project.endDate || '未设置'}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          任务进度: {progress}% ({completedTasks}/{totalTasks})
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => onSelect(project)}>查看详情</Button>
        <Button size="small" onClick={() => onEdit(project)}>编辑</Button>
        <Button size="small" color="error" onClick={() => onDelete(project.id)}>删除</Button>
      </CardActions>
    </Card>
  );
};

// 任务列表项组件
interface TaskListItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TaskListItem: React.FC<TaskListItemProps> = ({ task, onEdit, onDelete }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'info';
      case 'in-progress': return 'warning';
      case 'completed': return 'success';
      default: return 'default';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'todo': return '待办';
      case 'in-progress': return '进行中';
      case 'completed': return '已完成';
      default: return status;
    }
  };
  
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return '低';
      case 'medium': return '中';
      case 'high': return '高';
      default: return priority;
    }
  };
  
  return (
    <ListItem
      secondaryAction={
        <Box>
          <IconButton edge="end" aria-label="edit" onClick={() => onEdit(task)}>
            <EditIcon />
          </IconButton>
          <IconButton edge="end" aria-label="delete" onClick={() => onDelete(task.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      }
    >
      <ListItemText
        primary={
          <Box display="flex" alignItems="center">
            <Typography
              component="span"
              variant="body1"
              style={{ textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}
            >
              {task.title}
            </Typography>
            <Box ml={1} display="flex">
              <Chip 
                label={getPriorityText(task.priority)} 
                color={getPriorityColor(task.priority) as any} 
                size="small" 
              />
            </Box>
          </Box>
        }
        secondary={
          <>
            <Typography component="span" variant="body2" color="text.primary">
              {task.description}
            </Typography>
            {task.dueDate && (
              <Typography component="span" variant="body2" color="text.secondary">
                {' — 截止日期: '}{task.dueDate}
              </Typography>
            )}
          </>
        }
      />
    </ListItem>
  );
};

// 主项目管理组件
const ProjectManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // 获取项目列表
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectAPI.getProjects();
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };
    
    fetchProjects();
  }, []);
  
  // 创建新项目
  const handleCreateProject = () => {
    setEditingProject(null);
    setProjectDialogOpen(true);
  };
  
  // 编辑项目
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectDialogOpen(true);
  };
  
  // 保存项目
  const handleSaveProject = async (projectData: Omit<Project, 'id' | 'tasks'>) => {
    try {
      if (editingProject) {
        // 更新项目
        const updatedProject = await projectAPI.updateProject({
          ...editingProject,
          ...projectData,
        });
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
        if (selectedProject && selectedProject.id === updatedProject.id) {
          setSelectedProject(updatedProject);
        }
      } else {
        // 创建新项目
        const newProject = await projectAPI.createProject({
          ...projectData,
          tasks: [] // 添加空的任务数组
        });
        setProjects([...projects, newProject]);
      }
      setProjectDialogOpen(false);
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };
  
  // 删除项目
  const handleDeleteProject = async (projectId: string) => {
    try {
      await projectAPI.deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };
  
  // 创建新任务
  const handleCreateTask = () => {
    if (selectedProject) {
      setEditingTask(null);
      setTaskDialogOpen(true);
    }
  };
  
  // 编辑任务
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  };
  
  // 保存任务
  const handleSaveTask = async (taskData: Omit<Task, 'id'>) => {
    try {
      if (editingTask) {
        // 更新任务
        const updatedTask = await projectAPI.updateTask({
          ...editingTask,
          ...taskData,
        });
        // 更新本地状态
        const updatedProjects = projects.map(project => {
          if (project.id === updatedTask.projectId) {
            return {
              ...project,
              tasks: project.tasks.map(t => t.id === updatedTask.id ? updatedTask : t),
            };
          }
          return project;
        });
        setProjects(updatedProjects);
        if (selectedProject && selectedProject.id === updatedTask.projectId) {
          setSelectedProject({
            ...selectedProject,
            tasks: selectedProject.tasks.map(t => t.id === updatedTask.id ? updatedTask : t),
          });
        }
      } else if (selectedProject) {
        // 创建新任务
        const newTask = await projectAPI.createTask(taskData);
        // 更新本地状态
        const updatedProjects = projects.map(project => {
          if (project.id === newTask.projectId) {
            return {
              ...project,
              tasks: [...project.tasks, newTask],
            };
          }
          return project;
        });
        setProjects(updatedProjects);
        setSelectedProject({
          ...selectedProject,
          tasks: [...selectedProject.tasks, newTask],
        });
      }
      setTaskDialogOpen(false);
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };
  
  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    if (selectedProject) {
      try {
        await projectAPI.deleteTask(selectedProject.id, taskId);
        // 更新本地状态
        const updatedProjects = projects.map(project => {
          if (project.id === selectedProject.id) {
            return {
              ...project,
              tasks: project.tasks.filter(t => t.id !== taskId),
            };
          }
          return project;
        });
        setProjects(updatedProjects);
        setSelectedProject({
          ...selectedProject,
          tasks: selectedProject.tasks.filter(t => t.id !== taskId),
        });
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };
  
  // 返回项目列表
  const handleBackToProjects = () => {
    setSelectedProject(null);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      {selectedProject ? (
        // 项目详情视图
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Button variant="outlined" onClick={handleBackToProjects} sx={{ mr: 2 }}>
                返回项目列表
              </Button>
              <Typography variant="h5" component="h1" display="inline">
                {selectedProject.name}
              </Typography>
              <Chip 
                label={selectedProject.status === 'planning' ? '规划中' : selectedProject.status === 'in-progress' ? '进行中' : '已完成'} 
                color={selectedProject.status === 'planning' ? 'info' : selectedProject.status === 'in-progress' ? 'warning' : 'success'} 
                size="small" 
                sx={{ ml: 1 }} 
              />
            </Box>
            <Box>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => handleEditProject(selectedProject)}
                sx={{ mr: 1 }}
              >
                编辑项目
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateTask}
              >
                添加任务
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>项目详情</Typography>
                <Typography variant="body1" paragraph>{selectedProject.description}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 50%' }}>
                    <Typography variant="body2">开始日期: {selectedProject.startDate || '未设置'}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 50%' }}>
                    <Typography variant="body2">结束日期: {selectedProject.endDate || '未设置'}</Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>任务统计</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 33%' }}>
                    <Typography variant="body2">总任务数: {selectedProject.tasks.length}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 33%' }}>
                    <Typography variant="body2">待办: {selectedProject.tasks.filter(t => t.status === 'todo').length}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 33%' }}>
                    <Typography variant="body2">进行中: {selectedProject.tasks.filter(t => t.status === 'in-progress').length}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 33%' }}>
                    <Typography variant="body2">已完成: {selectedProject.tasks.filter(t => t.status === 'completed').length}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 33%' }}>
                    <Typography variant="body2">高优先级: {selectedProject.tasks.filter(t => t.priority === 'high').length}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 33%' }}>
                    <Typography variant="body2">中优先级: {selectedProject.tasks.filter(t => t.priority === 'medium').length}</Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, width: '100%' }}>
            {/* 待办任务列 */}
            <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px', mb: { xs: 2, md: 0 }, boxShadow: 3 }}>
              <Box p={2} display="flex" justifyContent="space-between" alignItems="center" bgcolor="#f5f5f5" borderBottom="3px solid #1976d2">
                <Typography variant="h6" fontWeight="bold">待办任务</Typography>
                <Chip label={selectedProject.tasks.filter(t => t.status === 'todo').length} color="primary" size="small" />
              </Box>
              <Divider />
              <List sx={{ flex: 1, overflow: 'auto' }}>
                {selectedProject.tasks.filter(t => t.status === 'todo').length > 0 ? (
                  selectedProject.tasks.filter(t => t.status === 'todo').map((task) => (
                    <React.Fragment key={task.id}>
                      <TaskListItem
                        task={task}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                      />
                      <Divider component="li" />
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="暂无待办任务" secondary="点击'添加任务'按钮创建新任务" />
                  </ListItem>
                )}
              </List>
            </Paper>

            {/* 进行中任务列 */}
            <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px', mb: { xs: 2, md: 0 }, boxShadow: 3 }}>
              <Box p={2} display="flex" justifyContent="space-between" alignItems="center" bgcolor="#e3f2fd" borderBottom="3px solid #1976d2">
                <Typography variant="h6" fontWeight="bold">进行中</Typography>
                <Chip label={selectedProject.tasks.filter(t => t.status === 'in-progress').length} color="primary" size="small" />
              </Box>
              <Divider />
              <List sx={{ flex: 1, overflow: 'auto' }}>
                {selectedProject.tasks.filter(t => t.status === 'in-progress').length > 0 ? (
                  selectedProject.tasks.filter(t => t.status === 'in-progress').map((task) => (
                    <React.Fragment key={task.id}>
                      <TaskListItem
                        task={task}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                      />
                      <Divider component="li" />
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="暂无进行中任务" secondary="将任务状态更新为'进行中'" />
                  </ListItem>
                )}
              </List>
            </Paper>

            {/* 已完成任务列 */}
            <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px', mb: { xs: 2, md: 0 }, boxShadow: 3 }}>
              <Box p={2} display="flex" justifyContent="space-between" alignItems="center" bgcolor="#e8f5e9" borderBottom="3px solid #2e7d32">
                <Typography variant="h6" fontWeight="bold">已完成</Typography>
                <Chip label={selectedProject.tasks.filter(t => t.status === 'completed').length} color="success" size="small" />
              </Box>
              <Divider />
              <List sx={{ flex: 1, overflow: 'auto' }}>
                {selectedProject.tasks.filter(t => t.status === 'completed').length > 0 ? (
                  selectedProject.tasks.filter(t => t.status === 'completed').map((task) => (
                    <React.Fragment key={task.id}>
                      <TaskListItem
                        task={task}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                      />
                      <Divider component="li" />
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="暂无已完成任务" secondary="将任务状态更新为'已完成'" />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Box>
        </Box>
      ) : (
        // 项目列表视图
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" component="h1">
              项目管理
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateProject}
            >
              创建项目
            </Button>
          </Box>
          
          {projects.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {projects.map((project) => (
                <Box sx={{ width: { xs: '100%', sm: '45%', md: '30%' } }} key={project.id}>
                  <ProjectCard
                    project={project}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                    onSelect={setSelectedProject}
                  />
                </Box>
              ))}
            </Box>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                暂无项目
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                点击"创建项目"按钮开始管理您的第一个项目
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateProject}
              >
                创建项目
              </Button>
            </Paper>
          )}
        </Box>
      )}
      
      {/* 项目表单对话框 */}
      <Dialog open={projectDialogOpen} onClose={() => setProjectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProject ? '编辑项目' : '创建项目'}</DialogTitle>
        <ProjectForm
          project={editingProject || undefined}
          onSave={handleSaveProject}
          onCancel={() => setProjectDialogOpen(false)}
        />
      </Dialog>
      
      {/* 任务表单对话框 */}
      <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTask ? '编辑任务' : '创建任务'}</DialogTitle>
        {selectedProject && (
          <TaskForm
            projectId={selectedProject.id}
            task={editingTask || undefined}
            onSave={handleSaveTask}
            onCancel={() => setTaskDialogOpen(false)}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default ProjectManagement;