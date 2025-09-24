import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  Avatar,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
  Stack,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { chatAPI } from '../../services/api';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  model?: string;
}

interface ChatModel {
  id: string;
  name: string;
  provider: string;
  description?: string;
}

interface ApiConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<ChatModel[]>([]);
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newApiConfig, setNewApiConfig] = useState<Partial<ApiConfig>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 初始化数据
  useEffect(() => {
    loadApiConfigs();
    loadAvailableModels();
  }, []);

  const loadApiConfigs = async () => {
    try {
      const configs = await chatAPI.getApiConfigs();
      setApiConfigs(configs);
    } catch (error) {
      console.error('Failed to load API configs:', error);
    }
  };

  const loadAvailableModels = async () => {
    try {
      const models = await chatAPI.getAvailableModels();
      setAvailableModels(models);
      if (models.length > 0 && !selectedModel) {
        setSelectedModel(models[0].id);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedModel) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatAPI.sendMessage({
        message: inputValue,
        model: selectedModel,
        history: messages,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
        model: selectedModel,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，发送消息时出现错误，请稍后重试。',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleAddApiConfig = async () => {
    if (!newApiConfig.name || !newApiConfig.baseUrl || !newApiConfig.apiKey) {
      return;
    }

    try {
      const config = await chatAPI.addApiConfig(newApiConfig as ApiConfig);
      setApiConfigs(prev => [...prev, config]);
      setNewApiConfig({});
      setSettingsOpen(false);
      loadAvailableModels(); // 重新加载模型列表
    } catch (error) {
      console.error('Failed to add API config:', error);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 头部工具栏 */}
      <Paper sx={{ p: 2, borderRadius: 0, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight={600}>
            AI 对话
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={clearChat}
              disabled={messages.length === 0}
            >
              清空对话
            </Button>
            <IconButton onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* 消息列表 */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <BotIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              开始与 AI 对话
            </Typography>
            <Typography variant="body2" color="text.secondary">
              选择一个模型，然后输入您的问题
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {messages.map((message) => (
              <ListItem key={message.id} sx={{ flexDirection: 'column', alignItems: 'stretch', p: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      maxWidth: '70%',
                      flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                        width: 32,
                        height: 32,
                      }}
                    >
                      {message.role === 'user' ? <PersonIcon /> : <BotIcon />}
                    </Avatar>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                        color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {message.timestamp.toLocaleTimeString()}
                        </Typography>
                        {message.model && (
                          <Chip
                            label={availableModels.find(m => m.id === message.model)?.name || message.model}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1, opacity: 0.7 }}
                          />
                        )}
                      </Box>
                    </Paper>
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                <BotIcon />
              </Avatar>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="body1">正在思考中...</Typography>
              </Paper>
            </Box>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* 输入区域 */}
      <Paper sx={{ p: 2, borderRadius: 0, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入您的问题... (按回车发送)"
            disabled={isLoading || !selectedModel}
            variant="outlined"
            size="small"
          />
          <FormControl size="small" sx={{ minWidth: 200, alignSelf: 'flex-end' }}>
            <InputLabel>选择模型</InputLabel>
            <Select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              label="选择模型"
            >
              {availableModels.map((model) => (
                <MenuItem key={model.id} value={model.id}>
                  <Box>
                    <Typography variant="body2">{model.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {model.provider}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* 设置对话框 */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>API 配置管理</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {/* 现有配置列表 */}
            <Box>
              <Typography variant="h6" gutterBottom>
                已配置的 API
              </Typography>
              {apiConfigs.map((config) => (
                <Card key={config.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1">{config.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {config.baseUrl}
                    </Typography>
                    <Typography variant="caption">
                      支持模型: {config.models.join(', ')}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Divider />

            {/* 添加新配置 */}
            <Box>
              <Typography variant="h6" gutterBottom>
                添加新的 API 配置
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="配置名称"
                    value={newApiConfig.name || ''}
                    onChange={(e) => setNewApiConfig(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <TextField
                    fullWidth
                    label="API 基础 URL"
                    value={newApiConfig.baseUrl || ''}
                    onChange={(e) => setNewApiConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="https://api.openai.com/v1"
                  />
                </Box>
                <TextField
                  fullWidth
                  label="API Key"
                  type="password"
                  value={newApiConfig.apiKey || ''}
                  onChange={(e) => setNewApiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                />
                <TextField
                  fullWidth
                  label="支持的模型 (用逗号分隔)"
                  value={(newApiConfig.models || []).join(', ')}
                  onChange={(e) => setNewApiConfig(prev => ({ 
                    ...prev, 
                    models: e.target.value.split(',').map(m => m.trim()).filter(m => m) 
                  }))}
                  placeholder="gpt-3.5-turbo, gpt-4"
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>取消</Button>
          <Button onClick={handleAddApiConfig} variant="contained" startIcon={<AddIcon />}>
            添加配置
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Chat;