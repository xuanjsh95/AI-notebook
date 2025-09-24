import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';

const PomodoroTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25分钟，以秒为单位
  const [isRunning, setIsRunning] = useState(false);
  const [totalTime] = useState(25 * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // 可以在这里添加提醒音效或通知
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTimeLeft(totalTime);
  };

  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <TimerIcon sx={{ mr: 1 }} />
        <Typography variant="h5" fontWeight={600}>
          番茄钟
        </Typography>
      </Box>

      <Paper sx={{ p: 3, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="h2" sx={{ mb: 2, fontFamily: 'monospace', fontWeight: 'bold' }}>
          {formatTime(timeLeft)}
        </Typography>
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ mb: 3, height: 8, borderRadius: 4 }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          {!isRunning ? (
            <IconButton 
              onClick={handleStart} 
              color="primary" 
              size="large"
              disabled={timeLeft === 0}
            >
              <PlayIcon sx={{ fontSize: 40 }} />
            </IconButton>
          ) : (
            <IconButton 
              onClick={handlePause} 
              color="warning" 
              size="large"
            >
              <PauseIcon sx={{ fontSize: 40 }} />
            </IconButton>
          )}
          
          <IconButton 
            onClick={handleStop} 
            color="error" 
            size="large"
            disabled={timeLeft === totalTime && !isRunning}
          >
            <StopIcon sx={{ fontSize: 40 }} />
          </IconButton>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {timeLeft === 0 ? '时间到！休息一下吧 🎉' : 
           isRunning ? '专注工作中...' : '点击开始专注工作'}
        </Typography>
      </Paper>
    </Box>
  );
};

export default PomodoroTimer;