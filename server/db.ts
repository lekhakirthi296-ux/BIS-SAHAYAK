import fs from 'fs';
import path from 'path';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{
    title: string;
    source: string;
    url: string;
    lastUpdated: string;
  }>;
  confidence?: 'high' | 'medium' | 'low';
  followUps?: string[];
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  audience: 'industry' | 'consumer';
  language: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface FeedbackEntry {
  id: string;
  messageId: string;
  rating: 'up' | 'down';
  comment?: string;
  queryText?: string;
  timestamp: string;
}

export interface UnansweredQuery {
  id: string;
  query: string;
  language: string;
  audience: string;
  timestamp: string;
  count: number;
}

export interface DbSchema {
  sessions: Record<string, ChatSession>;
  feedback: FeedbackEntry[];
  unansweredQueries: UnansweredQuery[];
  stats: {
    totalQueries: number;
    positiveFeedback: number;
    negativeFeedback: number;
    standardsSearched: number;
    licensesVerified: number;
  };
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'db.json');

const INITIAL_DB: DbSchema = {
  sessions: {},
  feedback: [],
  unansweredQueries: [],
  stats: {
    totalQueries: 0,
    positiveFeedback: 0,
    negativeFeedback: 0,
    standardsSearched: 0,
    licensesVerified: 0,
  },
};

export class Database {
  private data: DbSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DbSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          sessions: parsed.sessions || {},
          feedback: parsed.feedback || [],
          unansweredQueries: parsed.unansweredQueries || [],
          stats: {
            ...INITIAL_DB.stats,
            ...(parsed.stats || {}),
          },
        };
      } else {
        this.saveToFile(INITIAL_DB);
        return JSON.parse(JSON.stringify(INITIAL_DB));
      }
    } catch (err) {
      console.error('Error loading db.json, initializing fresh store:', err);
      return JSON.parse(JSON.stringify(INITIAL_DB));
    }
  }

  private saveToFile(state: DbSchema) {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const tmpPath = `${DB_PATH}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_PATH);
    } catch (err) {
      console.error('Failed to persist db.json:', err);
    }
  }

  private persist() {
    this.saveToFile(this.data);
  }

  // Session Management
  public getOrCreateSession(
    sessionId: string,
    audience: 'industry' | 'consumer' = 'industry',
    language: string = 'en',
    firstQuery?: string
  ): ChatSession {
    const existing = this.data.sessions[sessionId];
    if (existing) {
      existing.audience = audience;
      existing.language = language;
      return existing;
    }

    const title = firstQuery
      ? firstQuery.slice(0, 40) + (firstQuery.length > 40 ? '...' : '')
      : 'New Consultation';

    const newSession: ChatSession = {
      id: sessionId,
      title,
      audience,
      language,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    this.data.sessions[sessionId] = newSession;
    this.persist();
    return newSession;
  }

  public getSession(sessionId: string): ChatSession | null {
    return this.data.sessions[sessionId] || null;
  }

  public listSessions(): Array<{ id: string; title: string; updatedAt: string; messageCount: number }> {
    return Object.values(this.data.sessions)
      .map((s) => ({
        id: s.id,
        title: s.title,
        updatedAt: s.updatedAt,
        messageCount: s.messages.length,
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public appendMessages(sessionId: string, userMsg: ChatMessage, assistantMsg: ChatMessage) {
    const session = this.getOrCreateSession(sessionId);
    session.messages.push(userMsg, assistantMsg);
    session.updatedAt = new Date().toISOString();
    if (session.messages.length === 2 && userMsg.content) {
      session.title = userMsg.content.slice(0, 42);
    }

    this.data.stats.totalQueries += 1;
    this.persist();
  }

  public clearSession(sessionId: string) {
    if (this.data.sessions[sessionId]) {
      this.data.sessions[sessionId].messages = [];
      this.data.sessions[sessionId].updatedAt = new Date().toISOString();
      this.persist();
    }
  }

  // Feedback Management
  public addFeedback(entry: Omit<FeedbackEntry, 'id' | 'timestamp'>): FeedbackEntry {
    const fullEntry: FeedbackEntry = {
      ...entry,
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    this.data.feedback.unshift(fullEntry);
    if (entry.rating === 'up') {
      this.data.stats.positiveFeedback += 1;
    } else {
      this.data.stats.negativeFeedback += 1;
    }

    // Keep latest 200 feedback items
    if (this.data.feedback.length > 200) {
      this.data.feedback = this.data.feedback.slice(0, 200);
    }

    this.persist();
    return fullEntry;
  }

  // Unanswered Query Logging
  public logUnansweredQuery(query: string, language: string, audience: string) {
    const normalized = query.trim().toLowerCase();
    const existing = this.data.unansweredQueries.find(
      (u) => u.query.trim().toLowerCase() === normalized
    );

    if (existing) {
      existing.count += 1;
      existing.timestamp = new Date().toISOString();
    } else {
      this.data.unansweredQueries.unshift({
        id: `unans-${Date.now()}`,
        query: query.trim(),
        language,
        audience,
        timestamp: new Date().toISOString(),
        count: 1,
      });
    }

    if (this.data.unansweredQueries.length > 100) {
      this.data.unansweredQueries = this.data.unansweredQueries.slice(0, 100);
    }

    this.persist();
  }

  public incrementStandardsSearch() {
    this.data.stats.standardsSearched += 1;
    this.persist();
  }

  public incrementLicensesVerified() {
    this.data.stats.licensesVerified += 1;
    this.persist();
  }

  // Admin Stats
  public getStats() {
    const totalRatings = this.data.stats.positiveFeedback + this.data.stats.negativeFeedback;
    const thumbsDownRate = totalRatings > 0 ? (this.data.stats.negativeFeedback / totalRatings) * 100 : 0;

    return {
      totalQueries: this.data.stats.totalQueries,
      positiveFeedback: this.data.stats.positiveFeedback,
      negativeFeedback: this.data.stats.negativeFeedback,
      totalFeedback: totalRatings,
      thumbsDownRate: Math.round(thumbsDownRate * 10) / 10,
      standardsSearched: this.data.stats.standardsSearched,
      licensesVerified: this.data.stats.licensesVerified,
      activeSessionsCount: Object.keys(this.data.sessions).length,
      recentFeedback: this.data.feedback.slice(0, 20),
      topUnanswered: this.data.unansweredQueries
        .sort((a, b) => b.count - a.count)
        .slice(0, 15),
    };
  }
}

export const db = new Database();
