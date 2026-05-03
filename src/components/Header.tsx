import { useState } from 'react';
import { Download, FolderOpen, RefreshCcw, HelpCircle, X, ExternalLink } from 'lucide-react';

interface HeaderProps {
    onThemeChange: (theme: string) => void;
    currentTheme: string;
    binaryStatus: { found: boolean, message: string };
    onDownload: () => void;
    onSetPath: () => void;
    onResetPath: () => void;
    isDownloading: boolean;
    downloadProgress: number;
    version: string;
}

export default function Header({ onThemeChange, currentTheme, binaryStatus, onDownload, onSetPath, onResetPath, isDownloading, downloadProgress, version }: HeaderProps) {
    const [showHelp, setShowHelp] = useState(false);

    return (
        <header className="px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-6 relative z-50">
            {showHelp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xl p-4">
                    <div className="glass-card max-w-md w-full p-8 rounded-[40px] shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-main flex items-center gap-3">
                                <HelpCircle size={24} className="text-primary" /> Setup Guide
                            </h3>
                            <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-main/5 rounded-full text-secondary hover:text-main transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6 text-sm leading-relaxed text-secondary">
                            <p className="font-medium">Using a custom version of scrcpy is simple:</p>

                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                                    <p>
                                        Download scrcpy for your OS from
                                        <a href="https://github.com/Genymobile/scrcpy/releases/latest" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline inline-flex items-center gap-1 ml-1">
                                            GitHub <ExternalLink size={12} />
                                        </a>
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                                    <p>Unzip the archive to any folder on your computer.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                                    <p>Use the <span className="font-bold text-main inline-flex items-center gap-1"><FolderOpen size={14} /> Browse</span> icon in the header to select that folder.</p>
                                </div>
                            </div>

                            <p className="pt-4 border-t border-main/5 text-xs italic">The app will automatically detect the engine and remember your preference.</p>
                        </div>

                        <button
                            onClick={() => setShowHelp(false)}
                            className="w-full mt-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}

            {/* Left: Branding & Version */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-main">
                        scrcpy<span className="text-primary font-extrabold">GUI</span>
                    </h1>
                    <span className="px-2 py-0.5 bg-main/5 rounded-lg text-[10px] font-bold text-secondary tracking-widest uppercase">
                        v{version}
                    </span>
                </div>
            </div>

            {/* Center: Engine Status */}
            <div className="flex items-center gap-4">
                <div className="glass-card px-4 py-2 rounded-2xl flex items-center gap-4 transition-all hover:shadow-lg hover:shadow-primary/5">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${binaryStatus.found ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse'}`} />
                        <span className="text-xs font-bold text-main whitespace-nowrap">
                            {isDownloading ? `Installing Engine ${downloadProgress}%` : binaryStatus.found ? 'Engine Ready' : 'Setup Required'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1 pl-4 border-l border-main/5">
                        {!binaryStatus.found && !isDownloading && (
                            <button 
                                onClick={onDownload} 
                                className="p-2 hover:bg-emerald-500/10 text-emerald-600 rounded-xl transition-all" 
                                title="Install Core Engine"
                            >
                                <Download size={18} />
                            </button>
                        )}
                        <button 
                            onClick={onSetPath} 
                            className="p-2 hover:bg-main/5 text-secondary hover:text-primary rounded-xl transition-all" 
                            title="Select Folder"
                        >
                            <FolderOpen size={18} />
                        </button>
                        <button 
                            onClick={onResetPath} 
                            className="p-2 hover:bg-red-500/5 text-secondary hover:text-red-500 rounded-xl transition-all" 
                            title="Reset Engine"
                        >
                            <RefreshCcw size={18} />
                        </button>
                        {!binaryStatus.found && (
                            <button 
                                onClick={() => setShowHelp(true)} 
                                className="p-2 hover:bg-primary/5 text-secondary hover:text-primary rounded-xl transition-all" 
                                title="Get Help"
                            >
                                <HelpCircle size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Theme Switcher */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 bg-main/5 p-1.5 rounded-2xl">
                    {[
                        { id: 'light', color: '#f5f5f7', label: 'Default Light' },
                        { id: 'dark', color: '#1c1c1e', label: 'Default Dark' },
                        { id: 'ultraviolet', color: '#bf5af2', label: 'Ultraviolet' },
                        { id: 'astro', color: '#5e5ce6', label: 'Astro Blue' },
                        { id: 'emerald', color: '#30d158', label: 'Emerald' }
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => onThemeChange(t.id)}
                            className={`w-6 h-6 rounded-full transition-all hover:scale-110 active:scale-95 border-2 ${currentTheme === t.id ? 'border-primary shadow-sm scale-110' : 'border-transparent opacity-60'}`}
                            style={{ backgroundColor: t.color }}
                            title={t.label}
                        />
                    ))}
                </div>
            </div>
        </header>
    );
}
