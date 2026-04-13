import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useJobSourceSettingsStore } from '@/stores/jobSourceSettingsStore';

const STYLES = `
  @keyframes spin { to { transform: rotate(360deg); } }
  .jss-spinner { animation: spin 1s linear infinite; }
`;

const CATEGORY_COLORS: Record<string, string> = {
  api: '#3b82f6',
  browser: '#8b5cf6',
  ai: '#f59e0b',
  local: '#10b981',
};

const CATEGORY_LABELS: Record<string, string> = {
  api: 'API',
  browser: 'Browser',
  ai: 'AI',
  local: 'Local',
};

export default function JobSources() {
  const { user } = useUser();
  const { providers, isLoading, load, toggle } = useJobSourceSettingsStore();

  useEffect(() => {
    if (user?.id) {
      load(user.id);
    }
  }, [user?.id, load]);

  const activeCount = providers.filter((p) => p.isEnabled && p.readiness.ready).length;
  const totalCount = providers.length;

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto', fontFamily: 'inherit' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'inherit' }}>
            Job Sources
          </h1>
          <p style={{ marginTop: '6px', color: '#6b7280', fontSize: '14px' }}>
            Configure which job sources are used when discovering new opportunities
          </p>
          {!isLoading && (
            <p style={{ marginTop: '4px', fontSize: '13px', color: '#9ca3af' }}>
              {activeCount} of {totalCount} sources active
            </p>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
            <div
              className="jss-spinner"
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid #e5e7eb',
                borderTop: '2px solid #6b7280',
                borderRadius: '50%',
              }}
            />
            <span style={{ fontSize: '14px' }}>Loading sources…</span>
          </div>
        )}

        {/* Provider grid */}
        {!isLoading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {providers.map((provider) => (
              <ProviderCard
                key={provider.name}
                provider={provider}
                onToggle={(isEnabled) => {
                  if (user?.id) {
                    toggle(user.id, provider.name, isEnabled);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

interface ProviderCardProps {
  provider: {
    name: string;
    label: string;
    icon: string;
    description: string;
    isEnabled: boolean;
    category: string;
    readiness: { ready: boolean; reason?: string };
    requiresSession: boolean;
    requiresApiKey: string | null;
    isAiPowered: boolean;
  };
  onToggle: (isEnabled: boolean) => void;
}

function ProviderCard({ provider, onToggle }: ProviderCardProps) {
  const categoryColor = CATEGORY_COLORS[provider.category] ?? '#6b7280';
  const categoryLabel = CATEGORY_LABELS[provider.category] ?? provider.category;
  const { ready, reason } = provider.readiness;

  const readinessColor = ready ? '#10b981' : provider.requiresApiKey || provider.requiresSession ? '#f59e0b' : '#ef4444';
  const readinessTitle = ready ? 'Ready' : reason ?? 'Not ready';

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px',
        background: provider.isEnabled ? '#fafafa' : '#f9fafb',
        opacity: provider.isEnabled ? 1 : 0.7,
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Top row: icon, label, toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>{provider.icon}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>{provider.label}</span>
              {provider.isAiPowered && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#f59e0b',
                    background: '#fef3c7',
                    borderRadius: '4px',
                    padding: '1px 5px',
                  }}
                >
                  AI
                </span>
              )}
            </div>
            {/* Category badge */}
            <span
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: categoryColor,
                background: `${categoryColor}18`,
                borderRadius: '4px',
                padding: '1px 5px',
              }}
            >
              {categoryLabel}
            </span>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          onClick={() => onToggle(!provider.isEnabled)}
          title={provider.isEnabled ? 'Disable source' : 'Enable source'}
          style={{
            position: 'relative',
            width: '40px',
            height: '22px',
            borderRadius: '11px',
            border: 'none',
            cursor: 'pointer',
            background: provider.isEnabled ? '#3b82f6' : '#d1d5db',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '3px',
              left: provider.isEnabled ? '21px' : '3px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        </button>
      </div>

      {/* Description */}
      <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: 1.4 }}>
        {provider.description}
      </p>

      {/* Readiness indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          title={readinessTitle}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: readinessColor,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
          {ready ? 'Ready' : readinessTitle}
        </span>
      </div>

      {/* API key notice */}
      {provider.requiresApiKey && !ready && (
        <div
          style={{
            fontSize: '12px',
            color: '#92400e',
            background: '#fffbeb',
            borderRadius: '6px',
            padding: '6px 10px',
            border: '1px solid #fde68a',
          }}
        >
          Requires env var:{' '}
          <code style={{ fontFamily: 'monospace', fontWeight: 600 }}>{provider.requiresApiKey}</code>
        </div>
      )}

      {/* Session required notice */}
      {provider.requiresSession && !ready && (
        <div
          style={{
            fontSize: '12px',
            color: '#1e40af',
            background: '#eff6ff',
            borderRadius: '6px',
            padding: '6px 10px',
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>Requires browser session</span>
          <a
            href="/settings/sessions"
            style={{
              color: '#2563eb',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '12px',
            }}
          >
            Connect →
          </a>
        </div>
      )}
    </div>
  );
}
