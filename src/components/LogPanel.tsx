import { useRef, useEffect, useState, memo } from 'react';
import { Terminal, Trash2, Download } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface LogPanelProps {
    logs: string[];
    onClear: () => void;
    onAddLog?: (msg: string) => void;
    onRunCommand?: (cmd: string) => void;
}

const LogPanel = memo(({ logs, onClear, onAddLog, onRunCommand }: LogPanelProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLive, setIsLive] = useState(false);
    const [command, setCommand] = useState("");

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
        if (logs.length > 0) {
            setIsLive(true);
            const timer = setTimeout(() => setIsLive(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [logs.length]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && command.trim()) {
            onRunCommand?.(command.trim());
            setCommand("");
        }
    };

    return (
        <div className="glass-card rounded-[32px] h-[280px] flex-none overflow-hidden flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            {/* Console Header */}
            <div className="px-6 py-4 border-b border-main/5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <Terminal size={18} className="text-primary" />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-main">System Console</span>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${isLive ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]' : 'bg-main/10'}`} />
                            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{isLive ? 'Active' : 'Idle'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={async () => {
                            const storageData: Record<string, string> = {};
                            for (let i = 0; i < localStorage.length; i++) {
                                const key = localStorage.key(i);
                                if (key) storageData[key] = localStorage.getItem(key) || "";
                            }
                            const data = {
                                timestamp: new Date().toISOString(),
                                localStorage: storageData,
                                logs: logs
                            };
                            try {
                                const fileName = `scrcpy-gui-logs-${Date.now()}.json`;
                                await invoke('save_report', {
                                    content: JSON.stringify(data, null, 2),
                                    name: fileName
                                });
                                onAddLog?.(`[SYSTEM] Diagnostic report saved: ${fileName}`);
                            } catch (e) {
                                console.error("Export failed:", e);
                            }
                        }}
                        className="p-2.5 hover:bg-main/5 text-secondary hover:text-primary rounded-xl transition-all active:scale-95"
                        title="Export Diagnostic Report"
                    >
                        <Download size={18} />
                    </button>
                    <button
                        onClick={onClear}
                        className="p-2.5 hover:bg-red-500/5 text-secondary hover:text-red-500 rounded-xl transition-all active:scale-95"
                        title="Clear Console"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Console Body */}
            <div ref={containerRef} className="flex-1 overflow-y-auto p-6 font-mono custom-scrollbar bg-main/[0.02]">
                {logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <span className="text-xs text-secondary/40 font-medium italic">Waiting for connection sequence...</span>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {logs.map((log, i) => (
                            <div key={i} className="group flex gap-4 text-[11px] leading-relaxed py-1 px-3 rounded-lg hover:bg-main/[0.03] transition-colors border-l-2 border-transparent hover:border-primary/30">
                                <span className="text-secondary/30 font-bold shrink-0 tabular-nums">
                                    {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                                <span className="text-main/80 break-all selection:bg-primary/20 selection:text-primary">{log}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Console Input */}
            <div className="px-6 py-3 border-t border-main/5 bg-main/[0.03] flex items-center gap-3 shrink-0">
                <span className="text-primary font-bold text-sm select-none shrink-0">$</span>
                <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter console command..."
                    className="flex-1 bg-transparent border-none outline-none text-xs text-main placeholder:text-secondary/40 font-mono transition-colors"
                />
            </div>
        </div>
    );
});

export default LogPanel;
