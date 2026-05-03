import React from 'react';
import { Smartphone, RefreshCw, Wifi, UploadCloud } from 'lucide-react';

export interface SidebarProps {
    devices: string[];
    runningDevices: string[];
    onRefresh: () => void;
    onKillAdb: () => void;
    selectedDevice: string;
    onSelectDevice: (d: string) => void;
    onPair: (ip: string, code: string) => Promise<any>;
    onConnect: (ip: string) => Promise<any>;
    isAutoConnect: boolean;
    onToggleAuto: (val: boolean) => void;
    isRefreshing?: boolean;
    onFilePush: () => void;
    // History props
    historyDevices?: string[];
    clearHistory?: () => void;
    pushProgress?: { progress: number, speed: string, eta?: string };
}

export default function Sidebar({
    devices,
    runningDevices,
    onRefresh,
    onKillAdb,
    selectedDevice,
    onSelectDevice,
    onPair,
    onConnect,
    isAutoConnect,
    onToggleAuto,
    isRefreshing,
    onFilePush,
    historyDevices = [],
    clearHistory = () => { },
    pushProgress = { progress: 0, speed: '', eta: '' }
}: SidebarProps) {
    const [activeTab, setActiveTab] = React.useState<'usb' | 'wireless'>('usb');
    const [connectIp, setConnectIp] = React.useState('');
    const [pairIp, setPairIp] = React.useState('');
    const [pairCode, setPairCode] = React.useState('');

    const handleConnect = async (ip: string) => {
        if (!ip) return;
        await onConnect(ip);
    };

    return (
        <aside className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-700">
            {/* Device Hub Card */}
            <div className="glass-card p-5 rounded-[32px] space-y-4">
                <div className="flex justify-between items-center px-1">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-main">Devices</h2>
                    </div>
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className={`p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-all active:scale-90 ${isRefreshing ? 'opacity-50' : ''}`}
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Device List */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {devices.length === 0 ? (
                        <div className="text-center py-6 px-4 border-2 border-dashed border-primary/10 rounded-2xl bg-primary/5">
                            <Smartphone size={28} className="mx-auto text-primary/30 mb-2" />
                            <p className="text-xs font-semibold text-secondary">No devices</p>
                        </div>
                    ) : (
                        devices.map(d => {
                            const isRunning = runningDevices.includes(d);
                            const isSelected = selectedDevice === d;
                            return (
                                <button
                                    key={d}
                                    onClick={() => onSelectDevice(d)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group ${isSelected ? 'bg-primary border-primary shadow-lg shadow-primary/25' : 'bg-main/5 border-transparent hover:bg-main/10'}`}
                                >
                                    <div className={`p-1.5 rounded-xl transition-colors ${isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary group-hover:bg-primary/20'}`}>
                                        <Smartphone size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-main'}`}>{d}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {isRunning && (
                                                <span className="flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-white/80' : 'text-emerald-500'}`}>Live</span>
                                                </span>
                                            )}
                                            <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-white/60' : 'text-secondary'}`}>
                                                {d.includes('.') ? 'Wi-Fi' : 'USB'}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Connection Tabs */}
                <div className="bg-main/5 p-1 rounded-2xl flex gap-1">
                    <button
                        onClick={() => setActiveTab('usb')}
                        className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition-all ${activeTab === 'usb' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary hover:text-main'}`}
                    >
                        USB
                    </button>
                    <button
                        onClick={() => setActiveTab('wireless')}
                        className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition-all ${activeTab === 'wireless' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary hover:text-main'}`}
                    >
                        Wi-Fi
                    </button>
                </div>

                {/* Tab Content */}
                <div className="px-1 animate-in fade-in duration-300">
                    {activeTab === 'usb' ? (
                        <div className="bg-primary/5 rounded-2xl p-3 border border-primary/10">
                            <p className="text-[10px] text-secondary leading-tight">
                                Enable <span className="font-bold text-main">Developer Options</span> and <span className="font-bold text-main">USB Debugging</span>.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="bg-primary/5 rounded-2xl p-3 border border-primary/10">
                                <p className="text-[10px] text-secondary leading-tight">
                                    Connect to <span className="font-bold text-main">Same Wi-Fi</span> and enable <span className="font-bold text-main">Wireless Debugging</span>.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-main">Quick Connect</span>
                                    <button
                                        onClick={() => onToggleAuto(!isAutoConnect)}
                                        className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg transition-colors ${isAutoConnect ? 'text-primary' : 'text-secondary'}`}
                                    >
                                        <div className={`w-7 h-3.5 rounded-full relative transition-colors ${isAutoConnect ? 'bg-primary' : 'bg-main/20 ring-1 ring-main/10 dark:bg-white/10 dark:ring-white/10'}`}>
                                            <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${isAutoConnect ? 'left-4' : 'left-0.5'}`} />
                                        </div>
                                        <span className="text-[9px] font-bold uppercase">Auto</span>
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="192.168..."
                                        value={connectIp}
                                        onChange={(e) => setConnectIp(e.target.value)}
                                        className="flex-1 bg-main/5 border border-transparent rounded-xl px-3 py-1.5 text-xs focus:bg-white focus:border-primary/30 transition-all outline-none"
                                    />
                                    <button
                                        onClick={() => handleConnect(connectIp)}
                                        className="px-3 py-1.5 bg-primary text-white rounded-xl text-[10px] font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                                    >
                                        Connect
                                    </button>
                                </div>
                            </div>

                            {/* Recent Devices */}
                            {historyDevices.length > 0 && (
                                <div className="space-y-1.5 pt-1 border-t border-main/5">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">Recent</span>
                                        <button onClick={clearHistory} className="text-[9px] font-bold text-primary hover:underline">Clear</button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {historyDevices.slice(0, 2).map((ip, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setConnectIp(ip);
                                                    handleConnect(ip);
                                                }}
                                                className="flex items-center justify-between p-2 rounded-xl bg-main/5 hover:bg-main/10 transition-all group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Wifi size={12} className="text-primary/60" />
                                                    <span className="text-[10px] font-semibold text-main/80">{ip}</span>
                                                </div>
                                                <span className="text-[9px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">Connect</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Pairing (Android 11+) */}
                            <div className="pt-2 border-t border-main/5 space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[9px] font-bold text-main uppercase tracking-widest">Pairing</span>
                                    <span className="text-[8px] font-bold text-secondary uppercase tracking-tighter opacity-60">Android 11+</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <input
                                        type="text"
                                        placeholder="IP:Port"
                                        value={pairIp}
                                        onChange={(e) => setPairIp(e.target.value)}
                                        className="bg-main/5 border border-transparent rounded-xl px-2 py-1.5 text-[10px] focus:bg-white focus:border-primary/30 outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Code"
                                        value={pairCode}
                                        onChange={(e) => setPairCode(e.target.value)}
                                        className="bg-main/5 border border-transparent rounded-xl px-2 py-1.5 text-[10px] focus:bg-white focus:border-primary/30 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={() => onPair(pairIp, pairCode)}
                                    className="w-full py-1.5 bg-main/5 text-main hover:bg-main/10 rounded-xl text-[10px] font-bold transition-all"
                                >
                                    Start Pairing
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Flash/Push Widget */}
            <div
                onClick={onFilePush}
                className={`glass-card rounded-[32px] overflow-hidden cursor-pointer transition-all group border-2 border-dashed h-[110px] relative ${
                    pushProgress.progress > 0 
                    ? 'border-primary/50 shadow-lg shadow-primary/20' 
                    : 'border-primary/10 hover:border-primary/40 hover:bg-primary/5'
                }`}
                style={{ '--fill-level': `${pushProgress.progress}%` } as React.CSSProperties}
            >
                {pushProgress.progress > 0 ? (
                    <div className="fluid-tank h-full">
                        {/* Water Fill Layer */}
                        <div className="wave wave-back" />
                        <div className="wave wave-front" />
                        
                        {/* Progress Text */}
                        <div className="water-text text-white">
                            <div className="flex flex-col items-center animate-in zoom-in-90 duration-300">
                                <span className="text-3xl font-black tracking-tighter drop-shadow-md">
                                    {Math.round(pushProgress.progress)}%
                                </span>
                                <div className="flex flex-col items-center gap-0.5 mt-1">
                                    {pushProgress.speed && (
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-90 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-md">
                                            {pushProgress.speed}
                                        </span>
                                    )}
                                    {pushProgress.eta && (
                                        <span className="text-[8px] font-bold uppercase tracking-tight opacity-80 bg-black/10 px-1.5 rounded-sm">
                                            {pushProgress.eta}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2 p-4 relative overflow-hidden">
                        {/* Idle Decorative Glow */}
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary text-primary group-hover:text-white transition-all duration-500 shadow-sm relative z-10">
                            <UploadCloud size={24} className="group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="text-center relative z-10">
                            <h3 className="text-sm font-bold text-main group-hover:text-primary transition-colors">Transfer Files</h3>
                            <p className="text-[10px] text-secondary font-medium mt-0.5">Drag & drop or Click to browse</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ADB Kill (Hidden subtle button) */}
            <button
                onClick={onKillAdb}
                className="w-full py-1 text-[9px] font-bold text-secondary/30 hover:text-red-500/50 transition-colors uppercase tracking-widest"
            >
                Reset ADB Bridge
            </button>
        </aside>
    );
}
