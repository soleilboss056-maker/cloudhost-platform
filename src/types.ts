export type LanguageType = 'python' | 'nodejs' | 'go' | 'rust' | 'static' | 'docker' | 'php';

export type ProjectStatus = 'running' | 'building' | 'stopped' | 'failed' | 'deploying';

export interface EnvVariable {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
}

export interface CodeFile {
  path: string;
  content: string;
  language: string;
}

export interface DeploymentLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'command';
  message: string;
  source: 'build' | 'runtime' | 'system';
}

export interface DeploymentHistory {
  id: string;
  commitHash: string;
  commitMessage: string;
  deployedAt: string;
  status: ProjectStatus;
  durationMs: number;
  trigger: 'git_push' | 'manual' | 'env_update' | 'ai_fix';
  logs: DeploymentLog[];
}

export interface DatabaseAddon {
  id: string;
  type: 'postgresql' | 'redis' | 'storage' | 'mongodb';
  name: string;
  status: 'active' | 'provisioning' | 'stopped';
  connectionUrl: string;
  createdAt: string;
  allocatedSizeMb: number;
}

export interface ProjectMetrics {
  cpuUsagePercent: number;
  memoryUsageMb: number;
  memoryLimitMb: number;
  requestsPerMin: number;
  responseTimeMs: number;
  uptimePercentage: number;
  bandwidthUsedMb: number;
}

export interface HostedProject {
  id: string;
  name: string;
  slug: string;
  description: string;
  language: LanguageType;
  repoUrl?: string;
  branch?: string;
  files: CodeFile[];
  installCommand: string;
  startCommand: string;
  envVars: EnvVariable[];
  port: number;
  status: ProjectStatus;
  domain: string;
  customDomain?: string;
  createdAt: string;
  updatedAt: string;
  lastDeployedAt: string;
  metrics: ProjectMetrics;
  logs: DeploymentLog[];
  addons: DatabaseAddon[];
  deployments: DeploymentHistory[];
  isPublic: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  authProvider: 'email' | 'google';
  createdAt: string;
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: ('deploy_success' | 'deploy_failed' | 'server_error' | 'metrics_alert')[];
  secretKey: string;
  enabled: boolean;
  emailNotifications: boolean;
  notificationEmail: string;
  createdAt: string;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  status: 'delivered' | 'failed';
  responseCode: number;
  payload: any;
  emailSent: boolean;
  timestamp: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  language: LanguageType;
  description: string;
  icon: string;
  defaultPort: number;
  installCommand: string;
  startCommand: string;
  files: CodeFile[];
  defaultEnvVars: { key: string; value: string; isSecret: boolean }[];
}
