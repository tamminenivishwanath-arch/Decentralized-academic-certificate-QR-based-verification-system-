import { useEffect, useState } from 'react';
import { healthCheck, HealthResponse } from '@/utils/api';
import { cn } from '@/lib/utils';

type HealthStatus = 'connected' | 'partial' | 'disconnected' | 'loading';

export function HealthIndicator() {
  const [status, setStatus] = useState<HealthStatus>('loading');
  const [details, setDetails] = useState<HealthResponse | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await healthCheck();
        setDetails(response);
        
        if (response.connected && response.contract) {
          setStatus('connected');
        } else if (response.connected || response.status === 'ok') {
          setStatus('partial');
        } else {
          setStatus('disconnected');
        }
      } catch {
        setStatus('disconnected');
        setDetails(null);
      }
    };

    // Initial check
    checkHealth();

    // Poll every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    connected: {
      dot: 'status-dot-success',
      label: 'Connected',
      description: 'Backend and blockchain connected',
    },
    partial: {
      dot: 'status-dot-warning',
      label: 'Partial',
      description: 'Backend connected, contract status unknown',
    },
    disconnected: {
      dot: 'status-dot-error',
      label: 'Disconnected',
      description: 'Cannot connect to backend',
    },
    loading: {
      dot: 'status-dot bg-muted-foreground animate-pulse',
      label: 'Checking...',
      description: 'Checking connection status',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
        aria-label={`Backend status: ${config.label}`}
      >
        <span className={cn(config.dot)} />
        <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
          {config.label}
        </span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-56 p-3 rounded-lg glass-card text-sm z-50 animate-fade-in">
          <div className="font-medium text-foreground mb-2">Backend Status</div>
          <div className="space-y-1.5 text-muted-foreground">
            <div className="flex justify-between">
              <span>Connection:</span>
              <span className={details?.connected ? 'text-success' : 'text-destructive'}>
                {details?.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Contract:</span>
              <span className={details?.contract ? 'text-success' : 'text-warning'}>
                {details?.contract ? 'Active' : 'Unknown'}
              </span>
            </div>
            {details?.block && (
              <div className="flex justify-between">
                <span>Block:</span>
                <span className="text-foreground font-mono">{details.block}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
