import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Typography, Button, Paper, CircularProgress, Chip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SecurityIcon from '@mui/icons-material/Security';

const QUICK_QUESTIONS = [
  "What if Iran closes the Strait of Hormuz?",
  "Should we draw strategic reserves?",
  "How does a North Sea storm affect wind power?",
  "Show coal market risk details."
];

export default function ExecutiveChat() {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "### Welcome to AEGIS AI Operating System\n\nI am the **Energy Minister Intelligence Agent**. You can ask me about geopolitical disruption events, strategic petroleum reserve drawings, logistics detours, or power grid resilience plans.",
      confidence: 100,
      sources: ["AEGIS AI Knowledge Core"]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: messageText }]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/chat/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: data.reply,
        confidence: data.confidence_score,
        sources: data.sources
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: "Error connecting to AEGIS core service. Please ensure the backend is running.",
        confidence: 0,
        sources: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '550px' }}>
      <Box sx={{ borderBottom: '1px solid #1a2436', pb: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SecurityIcon color="primary" />
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#4fd1c5' }}>
          ENERGY MINISTER EXECUTIVE CO-PILOT
        </Typography>
      </Box>

      {/* Message Log */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, display: 'flex', flexDirection: 'column', gap: 2, pr: 1 }}>
        {messages.map((msg, idx) => (
          <Box
            key={idx}
            sx={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: msg.sender === 'user' ? '#1a202c' : '#0d131f',
              border: msg.sender === 'user' ? '1px solid #2d3748' : '1px solid #1a2436',
              borderRadius: '8px',
              p: 1.5
            }}
          >
            {/* Simple manual Markdown renderer for headings and bold texts */}
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, color: '#f7fafc' }}>
              {msg.text.split('\n').map((line, i) => {
                if (line.startsWith('### ')) {
                  return <Typography key={i} variant="subtitle1" sx={{ fontWeight: 800, mt: 1, mb: 0.5, color: '#4fd1c5' }}>{line.replace('### ', '')}</Typography>;
                }
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <Typography key={i} variant="body2" sx={{ fontWeight: 'bold', display: 'inline' }}>{line.replace(/\*\*/g, '')}</Typography>;
                }
                // Bullet points
                if (line.startsWith('* ')) {
                  return <li key={i} style={{ marginLeft: '12px' }}>{line.replace('* ', '')}</li>;
                }
                return <span key={i}>{line}<br/></span>;
              })}
            </Typography>

            {msg.sender === 'ai' && msg.confidence > 0 && (
              <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid #1a2436', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" sx={{ color: '#718096' }}>
                  Confidence: <span style={{ color: '#4fd1c5', fontWeight: 'bold' }}>{msg.confidence}%</span>
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {msg.sources.map((src, i) => (
                    <Chip key={i} label={src} size="small" sx={{ fontSize: '8px', height: '16px', background: '#111827', border: '1px solid #2d3748', color: '#cbd5e0' }} />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        ))}
        {loading && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" sx={{ color: '#718096' }}>Synthesizing agent intelligence...</Typography>
          </Box>
        )}
        <div ref={chatEndRef} />
      </Box>

      {/* Suggested Questions */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
        {QUICK_QUESTIONS.map((q, i) => (
          <Button
            key={i}
            variant="outlined"
            size="small"
            onClick={() => handleSend(q)}
            sx={{
              fontSize: '10px',
              py: 0.3,
              borderColor: 'rgba(79, 209, 197, 0.2)',
              color: '#cbd5e0',
              '&:hover': { borderColor: '#4fd1c5', background: 'rgba(79, 209, 197, 0.05)' }
            }}
          >
            {q}
          </Button>
        ))}
      </Box>

      {/* Message input */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Ask the energy cabinet assistant..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          sx={{
            input: { color: '#fff', fontSize: '13px' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#1a2436' },
              '&:hover fieldset': { borderColor: '#4fd1c5' },
              '&.Mui-focused fieldset': { borderColor: '#4fd1c5' }
            }
          }}
        />
        <IconButton color="primary" onClick={() => handleSend()} sx={{ border: '1px solid #1a2436', borderRadius: '8px' }}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
