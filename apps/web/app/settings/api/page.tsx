/**
 * API 配置页面 — 黑底白字红字点缀
 * 让用户自配置 AI Provider 和 API Key
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AIProviderConfig {
  provider: 'minimax' | 'claude' | 'deepseek' | 'custom';
  enabled: boolean;
  apiKey: string;          // 显示时已脱敏
  baseUrl?: string;
  model: string;
  hasKey: boolean;
  highQualityOnly?: boolean;
}

const DEFAULT_PROVIDERS: AIProviderConfig[] = [
  {
    provider: 'minimax',
    enabled: true,
    apiKey: '',
    baseUrl: 'https://api.minimaxi.chat/v1',
    model: 'MiniMax-M3',
    hasKey: false,
  },
  {
    provider: 'claude',
    enabled: false,
    apiKey: '',
    model: 'claude-sonnet-4-6',
    hasKey: false,
    highQualityOnly: true,
  },
  {
    provider: 'deepseek',
    enabled: false,
    apiKey: '',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    hasKey: false,
  },
  {
    provider: 'custom',
    enabled: false,
    apiKey: '',
    baseUrl: '',
    model: '',
    hasKey: false,
  },
];

export default function APIConfigPage() {
  const [providers, setProviders] = useState<AIProviderConfig[]>(DEFAULT_PROVIDERS);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ provider: string; success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const res = await fetch('/api/settings/api-keys');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setProviders((current) =>
            current.map((p) => {
              const saved = json.data[p.provider];
              if (saved) {
                return {
                  ...p,
                  enabled: saved.enabled,
                  hasKey: !!saved.apiKey,
                  apiKey: saved.apiKey || '',
                  baseUrl: saved.baseUrl || p.baseUrl,
                  model: saved.model || p.model,
                };
              }
              return p;
            })
          );
        }
      }
    } catch (err) {
      console.error('加载配置失败', err);
    }
  }

  async function saveProvider(config: AIProviderConfig) {
    setSaving(true);
    try {
      await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      await loadConfig();
      setEditingProvider(null);
    } catch (err) {
      console.error('保存失败', err);
    } finally {
      setSaving(false);
    }
  }

  async function testConnection(provider: string) {
    setTestingProvider(provider);
    setTestResult(null);
    try {
      const res = await fetch('/api/settings/api-keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const json = await res.json();
      setTestResult({
        provider,
        success: json.success,
        message: json.message,
      });
    } catch (err) {
      setTestResult({
        provider,
        success: false,
        message: '测试失败：网络错误',
      });
    } finally {
      setTestingProvider(null);
    }
  }

  return (
    <main className="bg-background min-h-screen">
      <section className="relative py-section">
        <span
          aria-hidden
          className="absolute top-12 right-8 text-[20vw] font-light text-accent/[0.06] leading-none select-none pointer-events-none"
        >
          06
        </span>

        <div className="ma-layout">
          <div className="ma-bleed-right">
            <div className="flex flex-col gap-12 max-w-prose">
              <div className="flex items-center gap-6">
                <div className="w-8 h-px bg-accent" />
                <Link
                  href="/settings"
                  className="meta-label hover:opacity-50 transition-opacity"
                >
                  ← 返回设置
                </Link>
              </div>

              <h1 className="editorial-title text-display-sm">
                API<br />配置
              </h1>

              <p className="text-muted-foreground leading-relaxed">
                配置 AI 大模型 API。系统会加密存储你的密钥，
                不会上传到第三方服务器。
              </p>

              <div className="flex flex-col gap-12 mt-12">
                {providers.map((p) => (
                  <ProviderCard
                    key={p.provider}
                    config={p}
                    isEditing={editingProvider === p.provider}
                    isTesting={testingProvider === p.provider}
                    testResult={
                      testResult?.provider === p.provider ? testResult : null
                    }
                    saving={saving}
                    onEdit={() => setEditingProvider(p.provider)}
                    onCancel={() => setEditingProvider(null)}
                    onSave={(updated) => saveProvider(updated)}
                    onTest={() => testConnection(p.provider)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProviderCard({
  config,
  isEditing,
  isTesting,
  testResult,
  saving,
  onEdit,
  onCancel,
  onSave,
  onTest,
}: {
  config: AIProviderConfig;
  isEditing: boolean;
  isTesting: boolean;
  testResult: { provider: string; success: boolean; message: string } | null;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (c: AIProviderConfig) => void;
  onTest: () => void;
}) {
  const [draft, setDraft] = useState(config);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  const providerLabels: Record<string, { name: string; desc: string; color: string }> = {
    minimax: {
      name: 'MiniMax-M3',
      desc: '主推理 / 中文友好 / 国内访问',
      color: 'text-accent',
    },
    claude: {
      name: 'Claude Sonnet 4.6',
      desc: '高质量场景 / 求职信 / 深度分析',
      color: 'text-accent',
    },
    deepseek: {
      name: 'DeepSeek-V3',
      desc: '成本兜底 / 大批量匹配',
      color: 'text-accent',
    },
    custom: {
      name: '自定义 Provider',
      desc: '兼容 OpenAI 协议的任何 API',
      color: 'text-foreground',
    },
  };

  const info = providerLabels[config.provider];

  return (
    <div className="border-t border-border pt-8">
      <div className="flex items-start justify-between gap-8 mb-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h3 className="editorial-title text-xl font-light">
              {info.name}
            </h3>
            {config.enabled && (
              <span className="meta-label text-accent">已启用</span>
            )}
            {config.highQualityOnly && (
              <span className="meta-label opacity-60">高质量</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{info.desc}</p>
          {config.hasKey && (
            <p className="text-xs text-muted-foreground/60 mt-2 font-mono">
              密钥：****{config.apiKey.slice(-4)}
            </p>
          )}
        </div>

        {!isEditing && (
          <Button variant="editorial" onClick={onEdit}>
            {config.hasKey ? '编辑' : '配置'}
          </Button>
        )}
      </div>

      {isEditing && (
        <div className="flex flex-col gap-6 mt-6 pl-0 md:pl-8">
          {config.provider !== 'minimax' && config.provider !== 'deepseek' && (
            <div className="flex flex-col gap-2">
              <label className="meta-label">Base URL</label>
              <input
                type="text"
                value={draft.baseUrl || ''}
                onChange={(e) =>
                  setDraft({ ...draft, baseUrl: e.target.value })
                }
                placeholder="https://api.example.com/v1"
                className="bg-transparent border border-border px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="meta-label">模型名称</label>
            <input
              type="text"
              value={draft.model || ''}
              onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              placeholder={config.provider === 'custom' ? 'gpt-4o, qwen-max, ...' : ''}
              className="bg-transparent border border-border px-4 py-3 text-sm focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="meta-label">API Key</label>
            <input
              type="password"
              value={draft.apiKey || ''}
              onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
              placeholder="sk-..."
              className="bg-transparent border border-border px-4 py-3 text-sm focus:border-accent focus:outline-none font-mono"
            />
            <p className="text-xs text-muted-foreground/60 mt-1">
              密钥使用 AES-256-GCM 加密存储，不会明文保存
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id={`enabled-${config.provider}`}
              checked={draft.enabled}
              onChange={(e) =>
                setDraft({ ...draft, enabled: e.target.checked })
              }
              className="accent-[hsl(var(--accent))]"
            />
            <label
              htmlFor={`enabled-${config.provider}`}
              className="text-sm"
            >
              启用此 Provider
            </label>
          </div>

          {testResult && (
            <div
              className={`text-sm p-4 border ${
                testResult.success
                  ? 'border-accent text-accent'
                  : 'border-red-500 text-red-500'
              }`}
            >
              {testResult.success ? '✓ ' : '✗ '}
              {testResult.message}
            </div>
          )}

          <div className="flex gap-4 mt-4">
            <Button
              variant="editorial"
              onClick={() => onSave(draft)}
              disabled={saving}
            >
              {saving ? '保存中…' : '保存'}
            </Button>
            <Button
              variant="ghost"
              onClick={onTest}
              disabled={isTesting || !draft.apiKey}
            >
              {isTesting ? '测试中…' : '测试连接'}
            </Button>
            <Button variant="ghost" onClick={onCancel}>
              取消
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
