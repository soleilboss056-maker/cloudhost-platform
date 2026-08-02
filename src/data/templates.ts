import { ProjectTemplate } from '../types';

export const STARTER_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'python-fastapi',
    name: 'Python FastAPI & Uvicorn API',
    language: 'python',
    description: 'API haute performance en Python avec FastAPI, documentation Swagger automatique et serveur Uvicorn.',
    icon: 'py',
    defaultPort: 8000,
    installCommand: 'pip install -r requirements.txt',
    startCommand: 'uvicorn main:app --host 0.0.0.0 --port 8000',
    defaultEnvVars: [],
    files: [
      {
        path: 'main.py',
        language: 'python',
        content: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import time

app = FastAPI(
    title="CloudHost Python Microservice",
    description="Microservice FastAPI déployé avec succès sur CloudHost",
    version="1.0.0"
)

class DataPayload(BaseModel):
    title: str
    tags: list[str] = []
    active: bool = True

items_db = [
    {"id": 1, "name": "Serveur Python #1", "status": "operational", "created_at": "2026-08-01"},
    {"id": 2, "name": "API Base de données", "status": "active", "created_at": "2026-08-01"}
]

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Bienvenue sur votre serveur Python FastAPI hébergé !",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "timestamp": time.time(),
        "endpoints": ["/api/health", "/api/items", "/docs"]
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "fastapi-core", "memory_mb": 42.5}

@app.get("/api/items")
def get_items():
    return {"items": items_db, "total": len(items_db)}

@app.post("/api/items")
def create_item(item: DataPayload):
    new_item = {"id": len(items_db) + 1, "name": item.title, "status": "active"}
    items_db.append(new_item)
    return {"success": True, "created": new_item}
`
      },
      {
        path: 'requirements.txt',
        language: 'plaintext',
        content: `fastapi==0.110.0
uvicorn==0.28.0
pydantic==2.6.4
gunicorn==21.2.0
`
      },
      {
        path: 'README.md',
        language: 'markdown',
        content: `# FastAPI Project on CloudHost
Déployé automatiquement via GitHub ou éditeur direct.
Commandes:
- Install: \`pip install -r requirements.txt\`
- Start: \`uvicorn main:app --host 0.0.0.0 --port 8000\`
`
      }
    ]
  },
  {
    id: 'python-flask',
    name: 'Python Flask & Gunicorn Web App',
    language: 'python',
    description: 'Application Web Python Flask légère avec routes JSON et rendu d\'interface intégrée.',
    icon: 'py',
    defaultPort: 5000,
    installCommand: 'pip install -r requirements.txt',
    startCommand: 'gunicorn --bind 0.0.0.0:5000 app:app',
    defaultEnvVars: [],
    files: [
      {
        path: 'app.py',
        language: 'python',
        content: `from flask import Flask, jsonify, request, render_template_string
import os

app = Flask(__name__)

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Mon App Python Flask - CloudHost</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
        .card { background: #1e293b; border: 1px solid #334155; padding: 2rem; border-radius: 12px; max-width: 600px; margin: 0 auto; }
        h1 { color: #38bdf8; margin-top: 0; }
        .badge { background: #10b981; color: #022c22; padding: 4px 10px; border-radius: 999px; font-weight: bold; font-size: 0.85rem; }
        pre { background: #090d16; padding: 1rem; border-radius: 8px; color: #a7f3d0; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="card">
        <span class="badge">🟢 EN LIGNE</span>
        <h1>Serveur Python Flask</h1>
        <p>Ce serveur Python tourne en continu sur <strong>CloudHost</strong> !</p>
        <h3>Variables d'environnement chargées :</h3>
        <pre>FLASK_ENV: {{ env_type }}\nDATABASE_URL: [MASQUÉE]</pre>
        <p><a href="/api/stats" style="color: #60a5fa;">Consulter l'API JSON /api/stats</a></p>
    </div>
</body>
</html>
"""

@app.route("/")
def home():
    env_type = os.getenv("FLASK_ENV", "production")
    return render_template_string(HTML_TEMPLATE, env_type=env_type)

@app.route("/api/stats")
def stats():
    return jsonify({
        "app": "Flask Backend",
        "version": "2.3.0",
        "requests_processed": 1420,
        "uptime": "99.98%",
        "status": "healthy"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
`
      },
      {
        path: 'requirements.txt',
        language: 'plaintext',
        content: `flask==3.0.2
gunicorn==21.2.0
requests==2.31.0
`
      }
    ]
  },
  {
    id: 'python-discord-bot',
    name: 'Bot Discord / Automation (Python)',
    language: 'python',
    description: 'Script ou Bot Python 24/7 sans serveur Web (Worker en tâche de fond avec boucle async).',
    icon: 'bot',
    defaultPort: 8080,
    installCommand: 'pip install -r requirements.txt',
    startCommand: 'python bot.py',
    defaultEnvVars: [],
    files: [
      {
        path: 'bot.py',
        language: 'python',
        content: `import os
import time
import asyncio

print("🤖 Démarrage du Bot Python Automation...")
prefix = os.getenv("BOT_PREFIX", "!")
token = os.getenv("DISCORD_TOKEN", "mock_token")

print(f"⚙️ Configuration: Prefix='{prefix}', Token={'*' * len(token)}")
print("🚀 Connexion au serveur de fond CloudHost...")

async def main_loop():
    counter = 0
    while True:
        counter += 1
        print(f"[LOG {time.strftime('%H:%M:%S')}] Task #{counter}: Vérification des événements en arrière-plan... (OK)")
        await asyncio.sleep(5)

if __name__ == "__main__":
    try:
        asyncio.run(main_loop())
    except KeyboardInterrupt:
        print("Bot arrêté proprement.")
`
      },
      {
        path: 'requirements.txt',
        language: 'plaintext',
        content: `discord.py==2.3.2
python-dotenv==1.0.1
`
      }
    ]
  },
  {
    id: 'nodejs-express',
    name: 'Node.js Express & TypeScript API',
    language: 'nodejs',
    description: 'Serveur web backend Node.js avec Express, gestion des CORS et routes RESTful.',
    icon: 'js',
    defaultPort: 3000,
    installCommand: 'npm install',
    startCommand: 'npm start',
    defaultEnvVars: [],
    files: [
      {
        path: 'index.js',
        language: 'javascript',
        content: `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    service: 'CloudHost Express API',
    status: 'ONLINE',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/users', (req, res) => {
  res.json({
    users: [
      { id: 101, name: 'Alice Dupont', role: 'DevOps' },
      { id: 102, name: 'Thomas Martin', role: 'Fullstack' }
    ]
  });
});

app.post('/api/webhook', (req, res) => {
  console.log('Webhook reçu:', req.body);
  res.status(200).json({ received: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 Serveur Node.js en écoute sur le port \${PORT}\`);
});
`
      },
      {
        path: 'package.json',
        language: 'json',
        content: `{
  "name": "express-cloudhost-app",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5"
  }
}`
      }
    ]
  },
  {
    id: 'go-gin-api',
    name: 'Go (Golang) Gin Web Server',
    language: 'go',
    description: 'Serveur ultra-rapide compilé en Go avec le framework Gin.',
    icon: 'go',
    defaultPort: 8080,
    installCommand: 'go build -o server main.go',
    startCommand: './server',
    defaultEnvVars: [],
    files: [
      {
        path: 'main.go',
        language: 'go',
        content: `package main

import (
	"fmt"
	"net/http"
	"os"
	"time"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, \`{"status":"active", "language":"Go", "message":"Serveur Golang compilé sur CloudHost!", "timestamp":"%s"}\`, time.Now().Format(time.RFC3339))
	})

	fmt.Printf("🚀 Serveur Go à l'écoute sur 0.0.0.0:%s\\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		fmt.Printf("Erreur serveur: %v\\n", err)
	}
}
`
      },
      {
        path: 'go.mod',
        language: 'plaintext',
        content: `module cloudhost/app

go 1.22
`
      }
    ]
  },
  {
    id: 'static-landing',
    name: 'HTML5 / JS / Tailwind Website',
    language: 'static',
    description: 'Site web statique HTML/CSS/JS ultra rapide servi avec Nginx ou Caddy.',
    icon: 'html',
    defaultPort: 80,
    installCommand: 'echo "No build required"',
    startCommand: 'npx serve -s . -p 80',
    defaultEnvVars: [],
    files: [
      {
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mon Site Déployé sur CloudHost</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen p-6">
    <div class="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        <div class="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
            🚀
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight mb-2 text-emerald-400">Site Statique Hébergé</h1>
        <p class="text-slate-400 mb-6">Votre code HTML/CSS/JS est désormais en ligne avec certificat SSL automatique et CDN mondial.</p>
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-semibold border border-emerald-500/30">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Statut: Déploiement Actif (CloudHost Edge)
        </div>
    </div>
</body>
</html>
`
      }
    ]
  }
];
