import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { mockApi, uploadApi } from '../services/mockApi';
import { connectWs, subscribeUser, sendMessage as wsSend, subscribePresence, announceOnline } from '../services/ws';
import { Send, User as UserIcon, Loader2, MessageSquare, ChevronLeft, BadgeCheck, Trash2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<User[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [inputText, setInputText] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [borrowedOwnerIds, setBorrowedOwnerIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await mockApi.getCurrentUser();
        if (user) {
          setCurrentUserId(user.id);
          connectWs();
          subscribeUser(user.id, (m) => {
            setMessages(prev => [...prev, m]);
          });
          subscribePresence((upd) => {
            setOnlineIds(prev => {
              const next = new Set(prev);
              if (upd.online) next.add(upd.userId); else next.delete(upd.userId);
              return next;
            });
          });
          announceOnline(user.id);
          try {
            const ids = await mockApi.getOnlineUserIds();
            setOnlineIds(new Set(ids));
          } catch {}
        }
      } catch (error) {
        console.error("Failed to fetch current user", error);
      }
    };
    fetchUser();
  }, []);

  // Load conversation list
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const users = await mockApi.getConversations();
        setConversations(users);
        if (users.length > 0 && !activeUser) {
           setActiveUser(users[0]); 
        }
      } finally {
        setLoadingList(false);
      }
    };
    fetchConversations();
  }, []);

  // Load contacts for starting new chats
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const cts = await mockApi.getContacts();
        setContacts(cts);
      } catch {}
    };
    loadContacts();
  }, []);

  useEffect(() => {
    const loadBorrowed = async () => {
      try {
        const hist = await mockApi.getBorrowingHistory();
        const owners = new Set<string>(hist.map(h => h.listing.ownerId));
        setBorrowedOwnerIds(owners);
      } catch {}
    };
    loadBorrowed();
  }, []);

  // Auto-select contact if no conversations
  useEffect(() => {
    if (!activeUser && conversations.length === 0 && contacts.length > 0) {
      setActiveUser(contacts[0]);
    }
  }, [contacts, conversations, activeUser]);

  // Load chat thread with selected user
  useEffect(() => {
    const loadThread = async () => {
      if (!activeUser) return;
      setLoadingChat(true);
      try {
        const msgs = await mockApi.getMessages(activeUser.id);
        setMessages(msgs);
      } finally {
        setLoadingChat(false);
      }
    };
    loadThread();
  }, [activeUser]);

  // Pick user from query param if available
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const uid = params.get('userId');
    if (uid && (!activeUser || activeUser.id !== uid)) {
      const pick = async () => {
        try {
          const convos = await mockApi.getConversations();
          const contactsList = await mockApi.getContacts();
          const found = [...convos, ...contactsList].find(u => u.id === uid);
          if (found) setActiveUser(found);
        } catch {}
      };
      pick();
    }
  }, [location.search]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeUser) return;

    const content = inputText;
    setInputText(''); // Optimistic clear

    try {
      if (currentUserId) {
        try {
          wsSend(currentUserId, activeUser.id, content);
          setMessages(prev => [...prev, { id: `local_${Date.now()}`, senderId: currentUserId, receiverId: activeUser.id, content, timestamp: new Date().toISOString(), isRead: false }]);
        } catch {
          const newMsg = await mockApi.sendMessage(activeUser.id, content);
          setMessages(prev => [...prev, newMsg]);
        }
      }
    } catch (err) {
      console.error("Failed to send", err);
      // Ideally show error toast
    }
  };

  const handleAttachImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUser) return;
    try {
      const url = await uploadApi.uploadListingImage(file);
      if (currentUserId) {
        try {
          wsSend(currentUserId, activeUser.id, inputText.trim(), url);
          setMessages(prev => [...prev, { id: `local_img_${Date.now()}`, senderId: currentUserId, receiverId: activeUser.id, content: inputText.trim(), imageUrl: url, timestamp: new Date().toISOString(), isRead: false }]);
          setInputText('');
        } catch {
          const newMsg = await mockApi.sendImageMessage(activeUser.id, url);
          setMessages(prev => [...prev, newMsg]);
        }
      }
    } catch (err) {
      console.error('Image upload failed', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      
      {/* Sidebar List */}
      <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col bg-gray-50 ${activeUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="font-bold text-gray-800">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-500" /></div>
          ) : (
            <div className="divide-y divide-gray-100">
              {[...new Map([...conversations, ...contacts].map(u => [u.id, u])).values()]
                .sort((a,b)=>{
                  const ab = borrowedOwnerIds.has(a.id) ? 1 : 0;
                  const bb = borrowedOwnerIds.has(b.id) ? 1 : 0;
                  return bb - ab;
                })
                .map(user => (
                <button
                  key={user.id}
                  onClick={() => setActiveUser(user)}
                  className={`w-full p-4 flex items-center space-x-3 hover:bg-white transition-colors text-left ${activeUser?.id === user.id ? 'bg-white border-l-4 border-l-brand-500 shadow-sm' : ''}`}
                >
                  <div className="relative">
                    <img src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/80/80`} onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${user.id}/80/80` }} alt={user.name} className="w-10 h-10 rounded-full bg-gray-200" />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 ${onlineIds.has(user.id) ? 'bg-emerald-500' : 'bg-red-500'} border-2 border-white rounded-full`}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate flex items-center">
                      {user.name}
                      <BadgeCheck className="text-blue-500 ml-1" size={14} aria-label="Verified" />
                    </p>
                    <p className="text-xs text-brand-600 font-medium">{user.trustScore}% Trust Score{borrowedOwnerIds.has(user.id) ? ' • Borrowed' : ''}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-white ${!activeUser ? 'hidden md:flex' : 'flex'}`}>
        {!activeUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p>Select a neighbor to start chatting</p>
          </div>
        ) : (
          <>
            {/* Mailbox Header */}
            <div className="p-4 border-b border-gray-100 flex items-center space-x-3 shadow-sm z-10">
              <button onClick={() => setActiveUser(null)} className="md:hidden text-gray-500">
                <ChevronLeft />
              </button>
              <img src={activeUser.avatarUrl || `https://picsum.photos/seed/${activeUser.id}/80/80`} onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${activeUser.id}/80/80` }} alt={activeUser.name} className="w-8 h-8 rounded-full" />
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center">
                  {activeUser.name}
                  <BadgeCheck className="text-blue-500 ml-1" size={16} aria-label="Verified" />
                </h3>
                <span className="text-xs text-green-600 flex items-center">
                  Verified Neighbor
                </span>
              </div>
              <div className="ml-auto flex items-center gap-2"></div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {loadingChat ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-brand-500" /></div>
              ) : (
                messages
                  .filter(m => {
                    if (!activeUser) return true;
                    return (
                      (m.senderId === currentUserId && m.receiverId === activeUser.id) ||
                      (m.senderId === activeUser.id && m.receiverId === currentUserId)
                    );
                  })
                  .map(msg => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                      {msg.imageUrl ? (
                        <div className={`${isMe ? 'bg-brand-600' : 'bg-white'} rounded-2xl p-1 shadow-sm border ${isMe ? 'border-brand-500' : 'border-gray-100'}`}>
                          <img src={msg.imageUrl} alt="attachment" className="max-w-[60vw] max-h-[50vh] rounded-xl" />
                          {msg.content && (
                            <p className={`mt-2 text-sm ${isMe ? 'text-white' : 'text-gray-800'}`}>{msg.content}</p>
                          )}
                          <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-gray-400'}`}>{formatTime(msg.timestamp)}</p>
                        </div>
                      ) : (
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe ? 'bg-brand-600 text-white' : 'bg-white text-gray-800 border border-gray-100'}`}>
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-gray-400'}`}>{formatTime(msg.timestamp)}</p>
                        </div>
                      )}
                      {isMe && (
                        <button onClick={async ()=>{ await mockApi.deleteMessage(msg.id); setMessages(prev=>prev.filter(m=>m.id!==msg.id)); }} className="p-1 text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAttachImage} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 border border-gray-200 rounded-full bg-white hover:bg-gray-50">📎</button>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-200 rounded-full px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
                <button 
                  type="submit" 
                  disabled={!inputText.trim()}
                  className="p-2 bg-brand-600 text-white rounded-full hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};