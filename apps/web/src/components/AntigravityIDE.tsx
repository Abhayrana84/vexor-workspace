'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Code2, FileCode, FolderOpen, Terminal, Play, Save, GitBranch, Eye,
  MessageSquare, CheckCircle, XCircle, Clock, ChevronRight, ChevronDown,
  Plus, Search, Settings, Maximize2, RefreshCw, Send, AlertTriangle,
  Download, Upload, Copy, RotateCcw, Zap, Cpu, BookOpen, FileText
} from 'lucide-react';

// ─── Mock project file tree ────────────────────────────────────────────────
const FILE_TREE = [
  {
    name: 'apps', type: 'dir', open: true, children: [
      {
        name: 'api', type: 'dir', open: true, children: [
          { name: 'src', type: 'dir', open: true, children: [
            { name: 'main.ts', type: 'file', lang: 'typescript' },
            { name: 'app.module.ts', type: 'file', lang: 'typescript' },
            { name: 'modules', type: 'dir', open: false, children: [
              { name: 'auth', type: 'dir', open: false, children: [
                { name: 'auth.controller.ts', type: 'file', lang: 'typescript' },
                { name: 'auth.service.ts', type: 'file', lang: 'typescript' },
                { name: 'jwt.strategy.ts', type: 'file', lang: 'typescript' },
              ]},
              { name: 'crm', type: 'dir', open: false, children: [
                { name: 'crm.controller.ts', type: 'file', lang: 'typescript' },
                { name: 'crm.service.ts', type: 'file', lang: 'typescript' },
              ]},
            ]},
          ]},
        ],
      },
      {
        name: 'web', type: 'dir', open: false, children: [
          { name: 'src', type: 'dir', open: false, children: [
            { name: 'app', type: 'dir', open: false, children: [
              { name: 'layout.tsx', type: 'file', lang: 'tsx' },
              { name: 'page.tsx', type: 'file', lang: 'tsx' },
            ]},
          ]},
        ],
      },
    ],
  },
  {
    name: 'packages', type: 'dir', open: false, children: [
      { name: 'db', type: 'dir', open: false, children: [
        { name: 'prisma', type: 'dir', open: false, children: [
          { name: 'schema.prisma', type: 'file', lang: 'prisma' },
          { name: 'seed.js', type: 'file', lang: 'javascript' },
        ]},
      ]},
    ],
  },
];

// ─── Starter file contents ─────────────────────────────────────────────────
const FILE_CONTENTS: Record<string, string> = {
  'main.ts': `import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(\`Vexor API running on: http://localhost:\${port}/api\`);
}
bootstrap();`,
  'app.module.ts': `import { Module } from '@nestjs/common';
import { DbModule } from './modules/db/db.module';
import { AuthModule } from './modules/auth/auth.module';
import { CrmModule } from './modules/crm/crm.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HrmsModule } from './modules/hrms/hrms.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { AiModule } from './modules/ai/ai.module';
import { AutomationModule } from './modules/automation/automation.module';

@Module({
  imports: [
    DbModule, AuthModule, CrmModule,
    ProjectsModule, FinanceModule, HrmsModule,
    MonitoringModule, AiModule, AutomationModule,
  ],
})
export class AppModule {}`,
  'auth.controller.ts': `import { Controller, Post, Body, Res, Req, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(body);
    res.cookie('token', result.token, { httpOnly: true, sameSite: 'lax', path: '/' });
    return result;
  }

  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(body.email, body.password);
    res.cookie('token', result.token, { httpOnly: true, sameSite: 'lax', path: '/' });
    return result;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', { path: '/' });
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }
}`,
  'schema.prisma': `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id             String   @id @default(uuid())
  email          String   @unique
  passwordHash   String
  firstName      String
  lastName       String
  avatarUrl      String?
  role           String   @default("DEVELOPER")
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  logoUrl   String?
  users     User[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`,
};

// ─── Review comments ───────────────────────────────────────────────────────
const INITIAL_REVIEWS: Record<string, any[]> = {
  'auth.controller.ts': [
    { id: 'r1', author: 'Alex Carter', role: 'FOUNDER', line: 16, text: 'Ensure httpOnly cookie is also setting Secure: true in production environments.', status: 'OPEN', time: '2h ago' },
    { id: 'r2', author: 'Jordan Lee', role: 'PROJECT_MANAGER', line: 28, text: 'Logout should also invalidate the JWT on the server side (Redis blocklist).', status: 'OPEN', time: '1h ago' },
  ],
  'main.ts': [
    { id: 'r3', author: 'Alex Carter', role: 'FOUNDER', line: 10, text: 'CORS origin list should be loaded from environment variables, not hardcoded.', status: 'RESOLVED', time: '3h ago' },
  ],
};

// ─── Terminal history ──────────────────────────────────────────────────────
const INITIAL_TERMINAL = [
  { type: 'system', text: '▸ Antigravity IDE Terminal — Vexor OS' },
  { type: 'system', text: '▸ Connected to Supabase PostgreSQL • Node v20.11.1 • NestJS 10' },
  { type: 'success', text: '✔ API server running on http://localhost:4000/api' },
  { type: 'success', text: '✔ Frontend running on http://localhost:3000' },
];

// ─── File tree node ────────────────────────────────────────────────────────
function TreeNode({ node, depth, onSelect, selected }: any) {
  const [open, setOpen] = useState(node.open ?? false);

  const handleClick = () => {
    if (node.type === 'dir') setOpen(!open);
    else onSelect(node);
  };

  const ext = node.name.split('.').pop();
  const langColor: Record<string, string> = {
    ts: 'text-blue-400', tsx: 'text-cyan-400', js: 'text-yellow-400',
    prisma: 'text-violet-400', json: 'text-orange-400', md: 'text-green-400',
  };
  const color = langColor[ext || ''] || 'text-muted-foreground';

  return (
    <div>
      <div
        onClick={handleClick}
        className={`flex items-center gap-1 py-0.5 px-2 rounded cursor-pointer text-xs transition select-none ${selected?.name === node.name ? 'bg-primary/15 text-primary' : 'hover:bg-secondary/60 text-muted-foreground hover:text-foreground'}`}
        style={{ paddingLeft: `${(depth * 12) + 8}px` }}
      >
        {node.type === 'dir' ? (
          <>
            {open ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
            <FolderOpen className="w-3 h-3 shrink-0 text-yellow-500" />
          </>
        ) : (
          <>
            <span className="w-3 h-3 shrink-0" />
            <FileCode className={`w-3 h-3 shrink-0 ${color}`} />
          </>
        )}
        <span className={node.type === 'file' ? color : 'text-foreground'}>{node.name}</span>
      </div>
      {node.type === 'dir' && open && node.children && (
        <div>
          {node.children.map((child: any) => (
            <TreeNode key={child.name} node={child} depth={depth + 1} onSelect={onSelect} selected={selected} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main IDE Component ────────────────────────────────────────────────────
export default function AntigravityIDE({ userRole }: { userRole: string }) {
  const isDeveloper = userRole === 'DEVELOPER';
  const isReviewer = ['FOUNDER', 'CO_FOUNDER', 'PROJECT_MANAGER'].includes(userRole);

  const [selectedFile, setSelectedFile] = useState<any>({ name: 'main.ts', lang: 'typescript' });
  const [fileContents, setFileContents] = useState<Record<string, string>>(FILE_CONTENTS);
  const [reviews, setReviews] = useState<Record<string, any[]>>(INITIAL_REVIEWS);
  const [terminalHistory, setTerminalHistory] = useState(INITIAL_TERMINAL);
  const [terminalInput, setTerminalInput] = useState('');
  const [showTerminal, setShowTerminal] = useState(true);
  const [showReviews, setShowReviews] = useState(true);
  const [newReviewLine, setNewReviewLine] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'editor' | 'diff' | 'ai'>('editor');
  const [searchQuery, setSearchQuery] = useState('');
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const currentContent = fileContents[selectedFile?.name] || '// Select a file to edit';
  const fileReviews = reviews[selectedFile?.name] || [];
  const openReviews = fileReviews.filter(r => r.status === 'OPEN');

  const handleSave = useCallback(() => {
    setSaved(prev => ({ ...prev, [selectedFile?.name]: true }));
    setTimeout(() => setSaved(prev => ({ ...prev, [selectedFile?.name]: false })), 2000);
    setTerminalHistory(prev => [...prev, { type: 'success', text: `✔ Saved ${selectedFile?.name}` }]);
  }, [selectedFile]);

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    setTerminalHistory(prev => [...prev, { type: 'input', text: `$ ${cmd}` }]);

    // Simulate common commands
    if (cmd.includes('npm run build')) {
      setTerminalHistory(prev => [...prev,
        { type: 'info', text: '> nest build' },
        { type: 'success', text: '✔ Build complete in 4.2s' }
      ]);
    } else if (cmd.includes('npm run start') || cmd.includes('npm run dev')) {
      setTerminalHistory(prev => [...prev,
        { type: 'success', text: '✔ Server started on http://localhost:4000/api' }
      ]);
    } else if (cmd.includes('prisma db push')) {
      setTerminalHistory(prev => [...prev,
        { type: 'info', text: 'Syncing schema to Supabase...' },
        { type: 'success', text: '✔ Database in sync with schema. Done in 8.2s' }
      ]);
    } else if (cmd.includes('git status')) {
      setTerminalHistory(prev => [...prev,
        { type: 'info', text: 'On branch feature/auth-jwt' },
        { type: 'info', text: 'Changes: auth.controller.ts (modified)' }
      ]);
    } else if (cmd.includes('git commit')) {
      setTerminalHistory(prev => [...prev,
        { type: 'success', text: `✔ [feature/auth-jwt] ${cmd.replace('git commit -m ', '')}` }
      ]);
    } else if (cmd === 'clear') {
      setTerminalHistory([{ type: 'system', text: '▸ Terminal cleared' }]);
    } else {
      setTerminalHistory(prev => [...prev,
        { type: 'error', text: `Command not found: ${cmd}` }
      ]);
    }
    setTerminalInput('');
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim() || !isReviewer) return;
    const roleLabel = userRole === 'FOUNDER' ? 'FOUNDER' : userRole === 'CO_FOUNDER' ? 'CO-FOUNDER' : 'PROJECT_MANAGER';
    const newComment = {
      id: Math.random().toString(),
      author: 'You',
      role: roleLabel,
      line: parseInt(newReviewLine) || 1,
      text: newReviewText,
      status: 'OPEN',
      time: 'just now',
    };
    setReviews(prev => ({
      ...prev,
      [selectedFile?.name]: [...(prev[selectedFile?.name] || []), newComment],
    }));
    setNewReviewLine('');
    setNewReviewText('');
  };

  const handleResolveReview = (fileKey: string, reviewId: string) => {
    setReviews(prev => ({
      ...prev,
      [fileKey]: prev[fileKey].map(r => r.id === reviewId ? { ...r, status: 'RESOLVED' } : r),
    }));
  };

  const terminalColor: Record<string, string> = {
    system: 'text-muted-foreground',
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400',
    input: 'text-foreground font-mono',
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[600px] rounded-2xl border border-border bg-[#0d0d12] overflow-hidden font-mono text-sm">

      {/* ── IDE Toolbar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-[#13131a] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Cpu className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-violet-400 font-bold">Antigravity</span>
            <span>IDE</span>
            <span className="text-border mx-1">·</span>
            <GitBranch className="w-3 h-3 text-green-400" />
            <span className="text-green-400">feature/auth-jwt</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {['editor', 'diff', 'ai'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition capitalize ${activeTab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
            >
              {t === 'ai' ? '✦ AI Assist' : t}
            </button>
          ))}
          <div className="w-px h-4 bg-border mx-1" />
          {isDeveloper && (
            <button
              onClick={handleSave}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition ${saved[selectedFile?.name] ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
            >
              {saved[selectedFile?.name] ? <CheckCircle className="w-3 h-3" /> : <Save className="w-3 h-3" />}
              {saved[selectedFile?.name] ? 'Saved!' : 'Save'}
            </button>
          )}
          <button
            onClick={() => setShowReviews(!showReviews)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition ${showReviews ? 'bg-indigo-500/15 text-indigo-400' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
          >
            <MessageSquare className="w-3 h-3" />
            Reviews {openReviews.length > 0 && <span className="ml-0.5 px-1 py-0 bg-red-500 text-white rounded-full text-[9px]">{openReviews.length}</span>}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* File tree */}
        <div className="w-52 shrink-0 border-r border-border/60 bg-[#0f0f16] overflow-y-auto py-2">
          <div className="flex items-center justify-between px-3 pb-2 border-b border-border/40">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Explorer</span>
            <button className="text-muted-foreground hover:text-foreground">
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-1">
            {FILE_TREE.map(node => (
              <TreeNode key={node.name} node={node} depth={0} onSelect={setSelectedFile} selected={selectedFile} />
            ))}
          </div>
        </div>

        {/* Main panel */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* File tab bar */}
          {selectedFile && (
            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/60 bg-[#0f0f16] shrink-0 overflow-x-auto">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] border ${saved[selectedFile.name] ? 'border-green-500/30 bg-green-500/5 text-green-400' : 'border-border/60 bg-[#13131a] text-foreground'}`}>
                <FileCode className="w-3 h-3 text-blue-400" />
                {selectedFile.name}
                {!saved[selectedFile.name] && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 ml-1" title="Unsaved changes" />}
              </div>
            </div>
          )}

          {/* Editor / Diff / AI */}
          <div className="flex flex-1 overflow-hidden">
            <div className={`flex-1 overflow-hidden flex flex-col ${activeTab !== 'editor' ? 'hidden' : ''}`}>
              {/* Line numbers + editor */}
              <div className="flex flex-1 overflow-auto">
                {/* Line numbers */}
                <div className="select-none text-right pr-3 pt-4 pb-4 pl-3 text-[11px] text-muted-foreground/40 leading-5 min-w-[48px] shrink-0 border-r border-border/30 bg-[#0d0d12]">
                  {currentContent.split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                {/* Code area */}
                <textarea
                  ref={editorRef}
                  value={currentContent}
                  readOnly={!isDeveloper}
                  onChange={(e) => {
                    if (!isDeveloper) return;
                    setFileContents(prev => ({ ...prev, [selectedFile.name]: e.target.value }));
                  }}
                  spellCheck={false}
                  className={`flex-1 resize-none bg-transparent text-[12px] leading-5 text-slate-300 pt-4 pb-4 pr-4 pl-4 outline-none font-mono w-full ${!isDeveloper ? 'cursor-default' : ''}`}
                  style={{ tabSize: 2 }}
                />
              </div>
            </div>

            {/* Diff view */}
            {activeTab === 'diff' && (
              <div className="flex-1 overflow-auto p-4 text-[11px] leading-5 font-mono">
                <div className="text-muted-foreground mb-3 text-[10px] uppercase tracking-widest">Diff — {selectedFile?.name} vs main</div>
                <div className="space-y-0.5">
                  {currentContent.split('\n').map((line, i) => {
                    const isAdded = i % 7 === 0 && i > 0;
                    const isRemoved = i % 11 === 0 && i > 0;
                    return (
                      <div key={i} className={`flex gap-3 px-2 rounded ${isAdded ? 'bg-green-500/10 text-green-400' : isRemoved ? 'bg-red-500/10 text-red-400 line-through opacity-60' : 'text-slate-400'}`}>
                        <span className="text-muted-foreground/40 w-6 text-right shrink-0">{i + 1}</span>
                        <span>{isAdded ? '+ ' : isRemoved ? '- ' : '  '}{line}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Assist */}
            {activeTab === 'ai' && (
              <div className="flex-1 overflow-auto p-5 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-bold text-violet-400">AI Code Assistant</span>
                  <span className="text-[10px] text-muted-foreground">— Context: {selectedFile?.name}</span>
                </div>
                {[
                  { prompt: 'Explain this file', response: `This file is \`${selectedFile?.name}\`, a ${selectedFile?.lang} module in the Vexor OS backend. It handles core application bootstrapping, middleware configuration, and route initialization for the NestJS API server running on port 4000.` },
                  { prompt: 'Suggest improvements', response: 'Consider adding rate limiting middleware, request correlation IDs for tracing, and structured JSON logging via a Winston transport layer. Also move CORS origins to environment config.' },
                  { prompt: 'Generate test cases', response: `describe('${selectedFile?.name}', () => {\n  it('should start the application', async () => {\n    const app = await NestFactory.create(AppModule);\n    await expect(app.listen(4000)).resolves.not.toThrow();\n  });\n});` },
                ].map((item, i) => (
                  <div key={i} className="border border-border/60 rounded-xl overflow-hidden">
                    <div className="bg-violet-500/10 px-3 py-2 text-[11px] font-bold text-violet-400 border-b border-border/40">
                      ✦ {item.prompt}
                    </div>
                    <pre className="p-3 text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">{item.response}</pre>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews panel */}
            {showReviews && (
              <div className="w-72 shrink-0 border-l border-border/60 bg-[#0f0f16] overflow-y-auto flex flex-col">
                <div className="px-3 py-2 border-b border-border/40 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Code Reviews</span>
                  {openReviews.length > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-red-500/15 text-red-400 border border-red-500/20 rounded-full font-bold">{openReviews.length} open</span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {fileReviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-[11px]">No reviews for this file.</div>
                  ) : (
                    fileReviews.map(review => (
                      <div key={review.id} className={`rounded-lg border p-2.5 space-y-1.5 ${review.status === 'RESOLVED' ? 'border-border/30 opacity-50' : 'border-indigo-500/30 bg-indigo-500/5'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${review.role === 'FOUNDER' ? 'bg-yellow-500/20 text-yellow-400' : review.role === 'CO_FOUNDER' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {review.author[0]}
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-foreground">{review.author}</p>
                              <p className="text-[9px] text-muted-foreground">{review.role} · Line {review.line}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${review.status === 'RESOLVED' ? 'text-green-400 bg-green-500/10' : 'text-orange-400 bg-orange-500/10'}`}>
                              {review.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{review.text}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-muted-foreground">{review.time}</span>
                          {isDeveloper && review.status === 'OPEN' && (
                            <button
                              onClick={() => handleResolveReview(selectedFile?.name, review.id)}
                              className="text-[9px] text-green-400 hover:underline flex items-center gap-0.5"
                            >
                              <CheckCircle className="w-2.5 h-2.5" /> Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add review — only for reviewers */}
                {isReviewer && (
                  <form onSubmit={handleAddReview} className="p-2 border-t border-border/40 space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Add Review Comment</p>
                    <input
                      type="number"
                      value={newReviewLine}
                      onChange={e => setNewReviewLine(e.target.value)}
                      placeholder="Line number"
                      min={1}
                      className="w-full text-[11px] px-2 py-1.5 rounded bg-[#13131a] border border-border/60 text-foreground outline-none"
                    />
                    <textarea
                      value={newReviewText}
                      onChange={e => setNewReviewText(e.target.value)}
                      placeholder="Your review comment..."
                      rows={3}
                      className="w-full text-[11px] px-2 py-1.5 rounded bg-[#13131a] border border-border/60 text-foreground outline-none resize-none"
                    />
                    <button type="submit" className="w-full py-1.5 bg-indigo-600 text-white rounded text-[11px] font-bold hover:bg-indigo-500 transition flex items-center justify-center gap-1">
                      <Send className="w-3 h-3" /> Submit Review
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* ── Terminal ── */}
          {showTerminal && (
            <div className="border-t border-border/60 bg-[#0a0a10] flex flex-col shrink-0" style={{ height: '180px' }}>
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3 h-3 text-green-400" />
                  <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Terminal</span>
                </div>
                <button onClick={() => setShowTerminal(false)} className="text-[10px] text-muted-foreground hover:text-foreground">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
                {terminalHistory.map((entry, i) => (
                  <div key={i} className={`text-[11px] leading-5 ${terminalColor[entry.type] || 'text-foreground'}`}>
                    {entry.text}
                  </div>
                ))}
              </div>
              <form onSubmit={handleRunCommand} className="flex items-center gap-2 px-3 py-1.5 border-t border-border/40">
                <span className="text-green-400 text-[11px] shrink-0">$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={e => setTerminalInput(e.target.value)}
                  placeholder={isDeveloper ? 'npm run build, git commit -m "...", prisma db push...' : 'Type a command to inspect...'}
                  className="flex-1 bg-transparent text-[11px] text-foreground outline-none font-mono"
                />
                <button type="submit" className="text-green-400 hover:text-green-300">
                  <Play className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {!showTerminal && (
            <div className="border-t border-border/60 px-3 py-1.5 shrink-0">
              <button onClick={() => setShowTerminal(true)} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Terminal className="w-3 h-3" /> Show Terminal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="flex items-center justify-between px-4 py-1 bg-[#1a0a2e] border-t border-violet-500/20 text-[10px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-violet-400 font-bold">✦ Antigravity IDE</span>
          <span>·</span>
          <span>{selectedFile?.lang || 'plaintext'}</span>
          <span>·</span>
          <span>{currentContent.split('\n').length} lines</span>
        </div>
        <div className="flex items-center gap-4">
          {isReviewer && <span className="text-indigo-400">Review Mode — {openReviews.length} open comments</span>}
          {isDeveloper && <span className="text-green-400">Edit Mode — Changes auto-tracked</span>}
          <span>Supabase · Connected</span>
        </div>
      </div>
    </div>
  );
}
