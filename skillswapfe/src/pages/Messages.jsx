import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const dummyChats = [
  { id: 1, name: 'Bob' },
  { id: 2, name: 'Jane' },
  { id: 3, name: 'Alice' },
];

const dummyMessages = {
  1: [
    { from: 'me', text: 'Hi Bob!', timestamp: new Date('2025-05-18T10:15:00') },
    { from: 'Bob', text: 'Hey! What’s up?', timestamp: new Date('2025-05-18T10:16:00') },
    { from: 'Bob', text: 'Are you coming tomorrow?', timestamp: new Date('2025-05-19T09:00:00') },
    { from: 'me', text: 'Yes, I’ll be there.', timestamp: new Date('2025-05-19T09:15:00') },
    { from: 'Bob', text: 'Great! Don’t forget the slides.', timestamp: new Date('2025-05-19T09:17:00') },
    { from: 'me', text: 'Already prepared 😎', timestamp: new Date('2025-05-19T09:18:00') },
    { from: 'Bob', text: 'You’re the best!', timestamp: new Date('2025-05-19T09:20:00') },
    { from: 'Bob', text: 'BTW, did you check the new specs?', timestamp: new Date('2025-05-20T08:45:00') },
    { from: 'me', text: 'Not yet. On it now.', timestamp: new Date('2025-05-20T08:47:00') },
    { from: 'me', text: 'They look doable.', timestamp: new Date('2025-05-20T09:00:00') },
    { from: 'Bob', text: 'Awesome. Let’s catch up later.', timestamp: new Date('2025-05-20T09:10:00') },
  ],
  2: [
    { from: 'me', text: 'Hi Jane', timestamp: new Date('2025-05-19T12:00:00') },
    { from: 'Jane', text: 'Hello!', timestamp: new Date('2025-05-19T12:05:00') },
  ],
  3: [],
};

const Messages = () => {
  const [showNewMessagePing, setShowNewMessagePing] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null); // Initially no chat selected
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState(dummyMessages);
  const [loading, setLoading] = useState(false); // <-- Loading state

  const scrollRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [readMessages, setReadMessages] = useState({});

  const observer = useRef(null);

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const msgIndex = entry.target.dataset.index;
            setReadMessages((prev) => ({
              ...prev,
              [selectedChatId]: {
                ...(prev[selectedChatId] || {}),
                [msgIndex]: true,
              },
            }));
          }
        });
      },
      { threshold: 1.0 }
    );
    return () => observer.current?.disconnect();
  }, [selectedChatId]);

  useEffect(() => {
    observer.current?.disconnect();
    const nodes = document.querySelectorAll('.msg');
    nodes.forEach((node) => observer.current?.observe(node));
  }, [messages, selectedChatId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, selectedChatId]);

  useEffect(() => {
    if (!isAtBottom) {
      setShowNewMessagePing(true);
    } else {
      setShowNewMessagePing(false);
    }
  }, [messages]);

  useEffect(() => {
    setReadMessages((prev) => ({
      ...prev,
      [selectedChatId]: prev[selectedChatId] || {},
    }));
  }, [selectedChatId]);

  // New: loading simulation when chat changes
  useEffect(() => {
    if (selectedChatId === null) return;
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
      // Scroll after loading finishes
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 800); // simulate 800ms load time
    return () => clearTimeout(timer);
  }, [selectedChatId]);

  const handleSend = () => {
    if (!inputText.trim() || selectedChatId === null) return;
    const newMsg = { from: 'me', text: inputText, timestamp: new Date() };
    setMessages((prev) => ({
      ...prev,
      [selectedChatId]: [...(prev[selectedChatId] || []), newMsg],
    }));
    setInputText('');
  };

  const handleScroll = () => {
    const node = scrollRef.current;
    if (!node) return;
    const bottomThreshold = 100;
    const isBottom = node.scrollHeight - node.scrollTop - node.clientHeight < bottomThreshold;
    setIsAtBottom(isBottom);
  };

  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (date) =>
    date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });

  const msgs = selectedChatId !== null ? messages[selectedChatId] || [] : [];
  let lastDate = null;

  return (
    <Box display="flex" height="calc(100vh - 64px)" position="relative">
      {/* Chat List */}
      <Box width="250px" bgcolor="#1E1E1E" color="white" p={2}>
        <Typography variant="h6" sx={{ color: '#00FF9F', mb: 2 }}>
          Chats
        </Typography>
        <List>
          {dummyChats.map((chat) => (
            <ListItem
              key={chat.id}
              component="button"
              onClick={() => setSelectedChatId(chat.id)}
              sx={{
                backgroundColor: selectedChatId === chat.id ? '#333' : 'transparent',
                color: selectedChatId === chat.id ? '#00FF9F' : 'white',
                borderColor: selectedChatId === chat.id ? '#00FF9F' : 'transparent',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#2a2a2a', borderColor: '#00FF9F' },
              }}
            >
              <ListItemText primary={chat.name} />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Chat Window */}
      {showNewMessagePing && (
        <Box
          onClick={() => {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            setShowNewMessagePing(false);
          }}
          sx={{
            position: 'absolute',
            bottom: 60,
            right: 20,
            bgcolor: '#00FF9F',
            color: 'black',
            px: 2,
            py: 1,
            borderRadius: 2,
            cursor: 'pointer',
            zIndex: 11,
            fontWeight: 'bold',
          }}
        >
          New Messages
        </Box>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        {selectedChatId === null ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'gray',
              fontSize: '1.2rem',
            }}
          >
            Select a chat to start messaging
          </Box>
        )
         : (
          <>
            {/* Message list */}
            <Box
              ref={scrollRef}
              onScroll={handleScroll}
              sx={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                '&::-webkit-scrollbar': { width: '8px' },
                '&::-webkit-scrollbar-track': { backgroundColor: '#1E1E1E' },
                '&::-webkit-scrollbar-thumb': { backgroundColor: '#00FF9F', borderRadius: '4px' },
                scrollbarWidth: 'thin',
                scrollbarColor: '#00FF9F #1E1E1E',
              }}
            >
              {msgs.map((msg, index) => {
                const msgDate = msg.timestamp ? msg.timestamp.toDateString() : '';
                const showDateSeparator = lastDate !== msgDate;
                lastDate = msgDate;

                return (
                  <React.Fragment key={index}>
                    {showDateSeparator && (
                      <Box
                        sx={{
                          alignSelf: 'center',
                          bgcolor: 'gray',
                          color: 'black',
                          px: 2,
                          py: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          mb: 1,
                        }}
                      >
                        {formatDate(msg.timestamp)}
                      </Box>
                    )}
                    <Box
                      className="msg"
                      data-index={index}
                      sx={{
                        alignSelf: msg.from === 'me' ? 'flex-end' : 'flex-start',
                        bgcolor: msg.from === 'me' ? '#00FF9F' : '#333',
                        color: msg.from === 'me' ? 'black' : 'white',
                        p: 1.5,
                        px: 2,
                        borderRadius: 2,
                        maxWidth: '70%',
                        position: 'relative',
                      }}
                    >
                      <Typography>{msg.text}</Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mt: 0.5,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '0.65rem',
                            color: msg.from === 'me'
                              ? 'rgba(0,0,0,0.6)'
                              : 'rgba(255,255,255,0.6)',
                          }}
                        >
                          {formatTime(msg.timestamp)}
                        </Typography>
                        {msg.from === 'me' && (
                          <Typography
                            sx={{
                              fontSize: '0.65rem',
                              color: 'rgba(0,0,0,0.6)',
                              ml: 1,
                            }}
                          >
                            {readMessages[selectedChatId]?.[index] ? <span style={{ color: 'blue' }}>✓✓</span> : '✓'}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </React.Fragment>
                );
              })}
            </Box>

            {/* Input bar */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                sx={{
                  bgcolor: 'white',
                  borderRadius: 1,
                }}
                disabled={loading}
              />

              <IconButton
                onClick={handleSend}
                sx={{
                  color: '#00FF9F',
                  bgcolor: 'black',
                  borderRadius: 0,
                  width: 45,
                  height: 45,
                }}
                disabled={loading}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Messages;
