import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

// SQLite ma'lumotlar bazasini yaratish (Preview muhiti uchun)
let db: any;
try {
  db = new Database('database.db');
  // Jadvallarni yaratish
  db.exec(`
    CREATE TABLE IF NOT EXISTS surveys (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      questions TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      survey_id TEXT NOT NULL,
      answers TEXT NOT NULL,
      submitted_at INTEGER NOT NULL,
      FOREIGN KEY (survey_id) REFERENCES surveys(id)
    );
  `);
} catch (err) {
  console.error('Database initialization error:', err);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Debugging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    res.setHeader('X-App-Status', 'Running');
    next();
  });

  // API Health Check
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // API Routes
  app.get('/api/surveys', (req, res) => {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    try {
      const surveys = db.prepare('SELECT * FROM surveys ORDER BY created_at DESC').all();
      res.json(surveys.map(s => ({
        id: (s as any).id,
        title: (s as any).title,
        code: (s as any).code,
        questions: JSON.parse((s as any).questions),
        createdAt: (s as any).created_at
      })));
    } catch (err) {
      res.status(500).json({ error: 'Database error', details: String(err) });
    }
  });

  app.get('/api/surveys/:code', (req, res) => {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    try {
      const survey = db.prepare('SELECT * FROM surveys WHERE code = ?').get(req.params.code);
      if (!survey) return res.status(404).json({ error: 'Survey not found' });
      res.json({
        id: (survey as any).id,
        title: (survey as any).title,
        code: (survey as any).code,
        questions: JSON.parse((survey as any).questions),
        createdAt: (survey as any).created_at
      });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/surveys', (req, res) => {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { title, code, questions } = req.body;
    const id = uuidv4();
    try {
      db.prepare('INSERT INTO surveys (id, title, code, questions, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(id, title, code, JSON.stringify(questions), Date.now());
      res.status(201).json({ id, title, code, questions });
    } catch (e) {
      res.status(400).json({ error: 'Code already exists or invalid data' });
    }
  });

  app.put('/api/surveys/:id', (req, res) => {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { title, code, questions } = req.body;
    try {
      db.prepare('UPDATE surveys SET title = ?, code = ?, questions = ? WHERE id = ?')
        .run(title, code, JSON.stringify(questions), req.params.id);
      res.json({ id: req.params.id, title, code, questions });
    } catch (e) {
      res.status(400).json({ error: 'Update failed' });
    }
  });

  app.delete('/api/surveys/:id', (req, res) => {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    try {
      db.transaction(() => {
        db.prepare('DELETE FROM responses WHERE survey_id = ?').run(req.params.id);
        db.prepare('DELETE FROM surveys WHERE id = ?').run(req.params.id);
      })();
      res.status(204).send();
    } catch (err) {
      console.error('Delete error:', err);
      res.status(500).json({ error: 'Delete failed' });
    }
  });

  app.get('/api/responses/:surveyId', (req, res) => {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    try {
      const responses = db.prepare('SELECT * FROM responses WHERE survey_id = ? ORDER BY submitted_at DESC').all(req.params.surveyId);
      res.json(responses.map(r => ({
        id: (r as any).id,
        surveyId: (r as any).survey_id,
        answers: JSON.parse((r as any).answers),
        submittedAt: (r as any).submitted_at
      })));
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/responses', (req, res) => {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { surveyId, answers } = req.body;
    const id = uuidv4();
    try {
      db.prepare('INSERT INTO responses (id, survey_id, answers, submitted_at) VALUES (?, ?, ?, ?)')
        .run(id, surveyId, JSON.stringify(answers), Date.now());
      res.status(201).json({ id, surveyId, answers });
    } catch (err) {
      res.status(500).json({ error: 'Submission failed' });
    }
  });

  // Catch-all for /api routes that don't match
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware or static serving
  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(distPath);

  console.log(`Environment: ${process.env.NODE_ENV}, Has Dist: ${hasDist}`);

  if (isProduction && hasDist) {
    console.log('Serving static files from dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('Starting Vite in middleware mode');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
