import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Mic,
  MicOff,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Sparkles,
  BookOpen,
  ShieldCheck,
  ExternalLink,
  PlusCircle,
  Loader2,
  Wrench,
} from 'lucide-react';
import { useApp, CitationItem } from '../context/AppContext.tsx';
import { FeedbackModal } from '../components/FeedbackModal.tsx';

export interface RetrievedChunkDebug {
  id: string;
  title: string;
  score: number;
  bm25Score: number;
  cosineScore: number;
  combinedScore: number;
  matchReasons: string[];
}

export interface MessageDebugInfo {
  intent: string;
  standaloneQuery: string;
  retrievedChunks: RetrievedChunkDebug[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: CitationItem[];
  confidence?: 'high' | 'medium' | 'low';
  followUps?: string[];
  debug?: MessageDebugInfo;
  timestamp: string;
}

export const ChatPage: React.FC = () => {
  const { language, audience, sessionId, resetSession, t, openCitationDrawer, showToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q');
  const isDebug = searchParams.get('debug') === '1';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Feedback modal state
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackTargetMessage, setFeedbackTargetMessage] = useState<Message | null>(null);
  const [ratedMessages, setRatedMessages] = useState<Record<string, 'up' | 'down'>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load existing session history on mount or session change
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.session && Array.isArray(data.session.messages) && data.session.messages.length > 0) {
            setMessages(data.session.messages);
          }
        }
      } catch (e) {
        console.error('Failed to load session:', e);
      }
    };
    fetchSession();
  }, [sessionId]);

  // If URL contains a query param 'q', send it automatically on first load
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery.trim());
      // Clear URL parameter so it doesn't re-trigger
      searchParams.delete('q');
      setSearchParams(searchParams, { replace: true });
    }
  }, [initialQuery]);

  const handleSendMessage = async (textToSend: string) => {
    const query = textToSend.trim();
    if (!query || isLoading) return;

    setInput('');
    const userMsgId = `u-${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language,
          audience,
          sessionId,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reach BIS Sahayak assistant.');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: data.messageId || `msg-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        citations: data.citations || [],
        confidence: data.confidence || 'medium',
        followUps: data.followUps || [],
        debug: data.debug,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          err.message ||
          'A temporary connection error occurred. Please verify your query or check back shortly.',
        confidence: 'low',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      showToast(err.message || 'Error processing response', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(t('copied'), 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (msg: Message, rating: 'up' | 'down') => {
    if (ratedMessages[msg.id]) return;

    if (rating === 'up') {
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: msg.id,
            rating: 'up',
            queryText: messages[messages.findIndex((m) => m.id === msg.id) - 1]?.content || '',
          }),
        });
        setRatedMessages((prev) => ({ ...prev, [msg.id]: 'up' }));
        showToast(t('feedbackSuccess'), 'success');
      } catch {
        showToast('Unable to record feedback', 'error');
      }
    } else {
      setFeedbackTargetMessage(msg);
      setFeedbackModalOpen(true);
    }
  };

  const handleFeedbackSubmitComment = async (comment: string) => {
    if (!feedbackTargetMessage) return;
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId: feedbackTargetMessage.id,
        rating: 'down',
        comment,
        queryText: messages[messages.findIndex((m) => m.id === feedbackTargetMessage.id) - 1]?.content || '',
      }),
    });
    setRatedMessages((prev) => ({ ...prev, [feedbackTargetMessage.id]: 'down' }));
  };

  const handleClearChat = async () => {
    try {
      await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Clear session error:', e);
    }
    setMessages([]);
    showToast(t('sessionCleared'), 'info');
  };

  const handleNewSession = () => {
    resetSession();
    setMessages([]);
    showToast(t('sessionCleared'), 'info');
  };

  // Voice recording handlers using MediaRecorder API
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      showToast('Microphone access denied or unavailable.', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Transcription failed');
      }

      const data = await res.json();
      if (data.transcript) {
        setInput(data.transcript);
        showToast(t('copied'), 'success');
      } else {
        showToast('Could not recognize speech, please try typing.', 'info');
      }
    } catch {
      showToast('Voice transcription failed. Please type your query.', 'error');
    } finally {
      setTranscribing(false);
    }
  };

  const suggestions = [
    t('promptSuggestion1'),
    t('promptSuggestion2'),
    t('promptSuggestion3'),
    t('promptSuggestion4'),
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4 flex flex-col h-[calc(100vh-8.5rem)]">
      {/* Top Session Action Bar */}
      <div className="flex items-center justify-between bg-surface px-4 py-2.5 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-text">
            {t('chatHeaderTitle')}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary-subtle text-primary hidden sm:inline">
            {audience === 'industry' ? t('audienceIndustry') : t('audienceConsumer')}
          </span>
          {isDebug && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1 shadow-xs">
              <Wrench className="w-3 h-3" />
              <span>Debug Active (?debug=1)</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNewSession}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl text-primary hover:bg-surface-hover transition-colors"
            title={t('newConsultation')}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('newConsultation')}</span>
          </button>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl text-rose-500 hover:bg-surface-hover transition-colors"
              title={t('clearChat')}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('clearChat')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-surface rounded-2xl border border-border shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-primary-subtle text-primary flex items-center justify-center mb-4 ring-8 ring-primary/10">
              <ShieldCheck className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-text mb-2">
              {t('chatEmptyTitle')}
            </h2>
            <p className="text-xs text-muted max-w-md leading-relaxed mb-6">
              {t('chatEmptyDesc')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full text-left">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(suggestion)}
                  className="p-3.5 rounded-xl border border-border bg-surface-subtle hover:border-primary text-xs text-text transition-all flex items-center justify-between group shadow-xs"
                >
                  <span className="line-clamp-2">{suggestion}</span>
                  <Sparkles className="w-3.5 h-3.5 text-accent shrink-0 ml-2 group-hover:scale-110 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <ShieldCheck className="w-4 h-4 text-accent" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 sm:p-5 shadow-xs transition-colors ${
                    isUser
                      ? 'bg-primary text-white rounded-tr-xs'
                      : 'bg-surface text-text border border-border rounded-tl-xs'
                  }`}
                >
                  {/* Top Metadata Header (Confidence badge & timestamp) */}
                  {!isUser && (
                    <div className="flex items-center justify-between pb-3 border-b border-border mb-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text text-xs">
                          {t('appTitle')}
                        </span>
                        {msg.confidence && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              msg.confidence === 'high'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : msg.confidence === 'medium'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-surface-subtle text-muted border border-border'
                            }`}
                          >
                            {msg.confidence === 'high'
                              ? t('confidenceHigh')
                              : msg.confidence === 'medium'
                              ? t('confidenceMedium')
                              : t('confidenceLow')}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* Message Body with Markdown */}
                  <div className={`prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed ${isUser ? 'text-white' : 'text-text'}`}>
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    )}
                  </div>

                  {/* Citations Section */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-text mb-2">
                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                        <span>{t('citationsTitle')} ({msg.citations.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((cit, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => openCitationDrawer(cit)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-surface-hover text-text text-xs font-medium border border-border transition-colors group"
                            title={cit.title}
                          >
                            <span className="truncate max-w-[200px] text-[11px] font-semibold">{cit.title}</span>
                            <ExternalLink className="w-3 h-3 text-muted group-hover:text-primary shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Follow-Ups */}
                  {!isUser && msg.followUps && msg.followUps.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-muted mb-2">
                        <Sparkles className="w-3 h-3 text-accent" />
                        <span>{t('suggestedFollowUps')}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.followUps.map((fu, fIdx) => (
                          <button
                            key={fIdx}
                            type="button"
                            onClick={() => handleSendMessage(fu)}
                            className="text-left px-3 py-1 rounded-full bg-surface-subtle hover:bg-surface-hover text-text text-xs font-semibold border border-border transition-colors shadow-2xs"
                          >
                            {fu}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hidden ?debug=1 Inspection Panel */}
                  {isDebug && msg.debug && (
                    <details className="mt-4 text-xs bg-surface-subtle text-text rounded-xl p-3 border border-border font-mono shadow-inner">
                      <summary className="cursor-pointer font-bold text-accent flex items-center justify-between select-none">
                        <span className="flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-accent" />
                          <span>{t('debugTitle')}</span>
                        </span>
                        <span className="text-[10px] text-muted hover:text-text">View Details ▾</span>
                      </summary>
                      <div className="mt-3 space-y-2.5 border-t border-border pt-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-muted">{t('debugIntent')}</span>
                          <span className="px-2 py-0.5 rounded bg-primary-subtle text-primary font-bold uppercase text-[10px]">
                            {msg.debug.intent}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted">{t('debugRewrittenQuery')}</span>
                          <div className="text-accent bg-surface p-2 rounded mt-1 border border-border text-[11px]">
                            "{msg.debug.standaloneQuery}"
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-muted mb-1">
                            <span className="font-bold">{t('debugRetrievedChunks')}</span>
                            <span className="text-[10px]">{msg.debug.retrievedChunks.length} chunks</span>
                          </div>
                          {msg.debug.retrievedChunks.length === 0 ? (
                            <p className="text-muted italic text-[11px]">No retrieval needed for smalltalk intent.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                              {msg.debug.retrievedChunks.map((rc, rIdx) => (
                                <div
                                  key={rIdx}
                                  className="p-2.5 rounded bg-surface border border-border text-[11px] space-y-1"
                                >
                                  <div className="flex items-center justify-between text-text font-bold">
                                    <span className="truncate max-w-[260px] sm:max-w-md">
                                      #{rIdx + 1} {rc.title}
                                    </span>
                                    <span className="text-emerald-500 font-mono shrink-0 ml-2">
                                      Score: {rc.score}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted">
                                    <span>BM25: {rc.bm25Score}</span>
                                    <span>Cosine Sim: {rc.cosineScore}</span>
                                    <span>Combined: {rc.combinedScore}</span>
                                  </div>
                                  {rc.matchReasons && rc.matchReasons.length > 0 && (
                                    <div className="text-[10px] text-primary font-medium">
                                      Factors: {rc.matchReasons.join(' • ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </details>
                  )}

                  {/* Assistant Footer: Copy and Thumbs Feedback */}
                  {!isUser && (
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="flex items-center gap-1 hover:text-text transition-colors"
                          title={t('copyAnswer')}
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-[11px] text-emerald-500 font-semibold">{t('copied')}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">{t('copyAnswer')}</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted">{t('thumbsUp')}?</span>
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg, 'up')}
                          disabled={Boolean(ratedMessages[msg.id])}
                          className={`p-1 rounded-lg hover:bg-surface-hover transition-colors ${
                            ratedMessages[msg.id] === 'up' ? 'text-emerald-500 font-bold' : ''
                          }`}
                          title={t('thumbsUp')}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg, 'down')}
                          disabled={Boolean(ratedMessages[msg.id])}
                          className={`p-1 rounded-lg hover:bg-surface-hover transition-colors ${
                            ratedMessages[msg.id] === 'down' ? 'text-rose-500 font-bold' : ''
                          }`}
                          title={t('thumbsDown')}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-accent" />
            </div>
            <div className="bg-surface border border-border rounded-2xl rounded-tl-xs p-4 shadow-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-muted font-medium">
                Searching BIS standards & official gazette records...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="bg-surface rounded-2xl p-2 border-2 border-border shadow-lg focus-within:border-primary transition-all"
      >
        <div className="flex items-center gap-2">
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={transcribing || isLoading}
            className={`p-2.5 rounded-xl transition-all ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse'
                : 'text-muted hover:bg-surface-hover hover:text-text'
            }`}
            title={isRecording ? t('stopRecording') : t('voiceSearch')}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isRecording
                ? t('recording')
                : transcribing
                ? t('transcribing')
                : t('chatInputPlaceholder')
            }
            disabled={isRecording || transcribing || isLoading}
            className="flex-1 py-2 text-xs sm:text-sm bg-transparent text-text placeholder:text-muted focus:outline-none"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading || isRecording}
            className="shrink-0 p-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            aria-label={t('sendQuestion')}
            title={t('sendQuestion')}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Thumbs Down Comment Modal */}
      <FeedbackModal
        messageId={feedbackTargetMessage?.id || ''}
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmitComment}
      />
    </div>
  );
};
