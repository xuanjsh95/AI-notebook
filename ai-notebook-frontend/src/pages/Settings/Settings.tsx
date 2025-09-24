import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Avatar,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Storage as StorageIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { UserSettings, User, UserStats } from '../../types';
import { userAPI, authAPI } from '../../services/api';

const Settings: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'light',
    language: 'zh-CN',
    notifications: {
      email: true,
      push: true,
      mentions: true,
      updates: false,
    },
    editor: {
      fontSize: 14,
      fontFamily: 'system',
      lineHeight: 1.6,
      autoSave: true,
      spellCheck: true,
    },
    privacy: {
      profileVisible: true,
      activityVisible: false,
      searchable: true,
    },
  });
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 对话框状态
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
  const [exportDataDialog, setExportDataDialog] = useState(false);
  
  // 表单状态
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    bio: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userData, settingsData, statsData] = await Promise.all([
          authAPI.getCurrentUser(),
          userAPI.getSettings(),
          userAPI.getStats(),
        ]);
        
        setUser(userData);
        setSettings(settingsData);
        setStats(statsData);
        setProfileForm({
          username: userData.username,
          email: userData.email,
          bio: '',
        });
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updatedUser = await userAPI.updateProfile(profileForm);
      setUser(updatedUser);
      setSuccess('个人信息已更新');
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError('更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const updatedSettings = await userAPI.updateSettings(settings);
      setSettings(updatedSettings);
      setSuccess('设置已保存');
    } catch (error) {
      console.error('Failed to update settings:', error);
      setError('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('新密码确认不匹配');
      return;
    }
    
    try {
      setSaving(true);
      await userAPI.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });
      setChangePasswordDialog(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('密码已更新');
    } catch (error) {
      console.error('Failed to change password:', error);
      setError('密码更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setError('请输入 DELETE 确认删除');
      return;
    }
    
    try {
      setSaving(true);
      await userAPI.deleteAccount();
      // 重定向到登录页面
      window.location.href = '/login';
    } catch (error) {
      console.error('Failed to delete account:', error);
      setError('删除账户失败');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      setSaving(true);
      const data = await userAPI.exportData();
      
      // 创建下载链接
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-notebook-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportDataDialog(false);
      setSuccess('数据导出成功');
    } catch (error) {
      console.error('Failed to export data:', error);
      setError('数据导出失败');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('avatar', file);
      
      const updatedUser = await userAPI.uploadAvatar(formData);
      setUser(updatedUser);
      setSuccess('头像已更新');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      setError('头像上传失败');
    } finally {
      setSaving(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        设置
      </Typography>

      {/* 错误和成功提示 */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 个人资料 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 24, height: 24 }} />
              个人资料
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                src={user?.avatar}
                sx={{ width: 80, height: 80, mr: 2 }}
              >
                {user?.username?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="avatar-upload"
                  type="file"
                  onChange={handleAvatarUpload}
                />
                <label htmlFor="avatar-upload">
                  <IconButton color="primary" component="span">
                    <PhotoCameraIcon />
                  </IconButton>
                </label>
                <Typography variant="caption" display="block" color="text.secondary">
                  点击更换头像
                </Typography>
              </Box>
            </Box>
            
            <TextField
              fullWidth
              label="用户名"
              value={profileForm.username}
              onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="邮箱"
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="个人简介"
              multiline
              rows={3}
              value={profileForm.bio}
              onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
              sx={{ mb: 2 }}
            />
            
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveProfile}
              disabled={saving}
            >
              保存资料
            </Button>
          </Paper>
        </Grid>

        {/* 账户统计 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorageIcon />
              账户统计
            </Typography>
            
            {stats && (
              <List>
                <ListItem>
                  <ListItemText primary="总笔记数" secondary={stats.total_notes} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="笔记本数" secondary={stats.total_notebooks} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="总字数" secondary={stats.total_words.toLocaleString()} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="存储使用" secondary={formatBytes(stats.storage_used || 0)} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="注册时间" secondary={new Date(user?.created_at || '').toLocaleDateString('zh-CN')} />
                </ListItem>
              </List>
            )}
          </Paper>
        </Grid>

        {/* 通知设置 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsIcon />
              通知设置
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText primary="邮件通知" secondary="接收重要更新的邮件通知" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.notifications.email}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: e.target.checked }
                    }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText primary="推送通知" secondary="接收浏览器推送通知" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.notifications.push}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, push: e.target.checked }
                    }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText primary="提及通知" secondary="当有人提及你时通知" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.notifications.mentions}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, mentions: e.target.checked }
                    }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText primary="产品更新" secondary="接收新功能和更新通知" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.notifications.updates}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, updates: e.target.checked }
                    }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* 编辑器设置 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaletteIcon />
              编辑器设置
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>字体大小</InputLabel>
              <Select
                value={settings.editor.fontSize}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  editor: { ...prev.editor, fontSize: e.target.value as number }
                }))}
              >
                <MenuItem value={12}>12px</MenuItem>
                <MenuItem value={14}>14px</MenuItem>
                <MenuItem value={16}>16px</MenuItem>
                <MenuItem value={18}>18px</MenuItem>
                <MenuItem value={20}>20px</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>字体</InputLabel>
              <Select
                value={settings.editor.fontFamily}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  editor: { ...prev.editor, fontFamily: e.target.value }
                }))}
              >
                <MenuItem value="system">系统默认</MenuItem>
                <MenuItem value="serif">衬线字体</MenuItem>
                <MenuItem value="monospace">等宽字体</MenuItem>
              </Select>
            </FormControl>
            
            <List>
              <ListItem>
                <ListItemText primary="自动保存" secondary="编辑时自动保存笔记" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.editor.autoSave}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      editor: { ...prev.editor, autoSave: e.target.checked }
                    }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText primary="拼写检查" secondary="启用拼写检查功能" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.editor.spellCheck}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      editor: { ...prev.editor, spellCheck: e.target.checked }
                    }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* 主题和语言 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LanguageIcon />
              外观和语言
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>主题</InputLabel>
              <Select
                value={settings.theme}
                onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value as any }))}
              >
                <MenuItem value="light">浅色</MenuItem>
                <MenuItem value="dark">深色</MenuItem>
                <MenuItem value="auto">跟随系统</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>语言</InputLabel>
              <Select
                value={settings.language}
                onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
              >
                <MenuItem value="zh-CN">简体中文</MenuItem>
                <MenuItem value="en-US">English</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        {/* 隐私设置 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon />
              隐私设置
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText primary="公开个人资料" secondary="允许其他用户查看你的个人资料" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.privacy.profileVisible}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, profileVisible: e.target.checked }
                    }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText primary="显示活动状态" secondary="显示你的在线状态和最近活动" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.privacy.activityVisible}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, activityVisible: e.target.checked }
                    }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText primary="允许搜索" secondary="允许其他用户通过搜索找到你" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.privacy.searchable}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, searchable: e.target.checked }
                    }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* 数据管理 */}
        <Grid size={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorageIcon />
              数据管理
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => setExportDataDialog(true)}
              >
                导出数据
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                component="label"
              >
                导入数据
                <input type="file" hidden accept=".json" />
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* 账户安全 */}
        <Grid size={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon />
              账户安全
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setChangePasswordDialog(true)}
              >
                修改密码
              </Button>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" color="error" gutterBottom>
              危险操作
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              删除账户将永久删除你的所有数据，此操作无法撤销。
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteAccountDialog(true)}
            >
              删除账户
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* 保存设置按钮 */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
          disabled={saving}
        >
          保存设置
        </Button>
      </Box>

      {/* 修改密码对话框 */}
      <Dialog open={changePasswordDialog} onClose={() => setChangePasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>修改密码</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="password"
            label="当前密码"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            type="password"
            label="新密码"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="password"
            label="确认新密码"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordDialog(false)}>取消</Button>
          <Button onClick={handleChangePassword} variant="contained" disabled={saving}>
            确认修改
          </Button>
        </DialogActions>
      </Dialog>

      {/* 导出数据对话框 */}
      <Dialog open={exportDataDialog} onClose={() => setExportDataDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>导出数据</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            导出的数据将包含你的所有笔记、笔记本和设置信息，以 JSON 格式保存。
          </Typography>
          <Alert severity="info">
            导出的数据不包含密码等敏感信息。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDataDialog(false)}>取消</Button>
          <Button onClick={handleExportData} variant="contained" disabled={saving}>
            导出
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除账户对话框 */}
      <Dialog open={deleteAccountDialog} onClose={() => setDeleteAccountDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle color="error">删除账户</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            此操作将永久删除你的账户和所有数据，无法恢复！
          </Alert>
          <Typography variant="body2" sx={{ mb: 2 }}>
            请输入 <strong>DELETE</strong> 确认删除：
          </Typography>
          <TextField
            fullWidth
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="输入 DELETE"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAccountDialog(false)}>取消</Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={saving || deleteConfirmation !== 'DELETE'}
          >
            确认删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;