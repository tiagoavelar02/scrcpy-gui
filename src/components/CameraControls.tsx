import { useState, useRef, useEffect } from 'react';
import { Mic, Laptop, Square, RefreshCcw, RotateCw, Settings, Zap, Check } from 'lucide-react';
import { ScrcpyConfig } from '../hooks/useScrcpy';

interface CameraControlsProps {
    config: ScrcpyConfig;
    onToggleMic: () => void;
    onToggleCamera: () => void;
    onSetRotation: (rotation: string) => void;
    onSetQuality: (res: string) => void;
    onSetFPS: (fps: number) => void;
    onEndSession: () => void;
}

export default function CameraControls({ 
    config, 
    onToggleMic, 
    onToggleCamera, 
    onSetRotation, 
    onSetQuality,
    onSetFPS,
    onEndSession 
}: CameraControlsProps) {
    const [activeDropdown, setActiveDropdown] = useState<'quality' | 'fps' | 'rotation' | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        };
        if (activeDropdown) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeDropdown]);

    if (!config) return null;
    
    const isPhoneMic = config.audioEnabled && config.audioSource === 'mic';
    const facing = config.cameraFacing || 'back';
    const rotation = config.rotation || '0';
    const res = config.res || '0';
    const fps = config.fps || 0;

    const getResLabel = (r: string) => {
        if (r === '0') return 'Original';
        if (r === '1920') return '1080p';
        if (r === '1280') return '720p';
        if (r === '3840') return '4K';
        if (r === '2560') return '2K';
        return r;
    };

    const qualityOptions = [
        { value: '0', label: 'Original' },
        { value: '3840', label: '4K (UHD)' },
        { value: '2560', label: '2K (QHD)' },
        { value: '1920', label: '1080p (HD)' },
        { value: '1280', label: '720p' },
    ];

    const fpsOptions = [
        { value: 0, label: 'Auto (Original)' },
        { value: 30, label: '30 FPS' },
        { value: 60, label: '60 FPS' },
        { value: 90, label: '90 FPS' },
        { value: 120, label: '120 FPS' },
    ];

    const rotationOptions = [
        { value: '0', label: '0° (Upright)' },
        { value: '90', label: '90°' },
        { value: '180', label: '180°' },
        { value: '270', label: '270°' },
    ];

    return (
        <div ref={dropdownRef} className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 p-1.5 rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-8 duration-500 group z-[9999]">
            {/* Session Info */}
            <div className="flex items-center gap-3 px-3 border-r border-white/10 mr-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter leading-none">Live Camera</span>
                    <span className="text-xs font-bold text-white tabular-nums truncate max-w-[60px]">{config.device || 'Device'}</span>
                </div>
            </div>

            {/* Mic Source Toggle */}
            <button
                onClick={(e) => { e.stopPropagation(); onToggleMic(); }}
                className={`p-2.5 px-4 rounded-2xl transition-all duration-500 flex flex-col items-center gap-1 group/btn ${isPhoneMic ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                title="Switch Microphone Source"
            >
                {isPhoneMic ? <Mic size={18} /> : <Laptop size={18} />}
                <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
                    {isPhoneMic ? 'Phone' : 'PC'} Mic
                </span>
            </button>

            {/* Camera Flip */}
            <button
                onClick={(e) => { e.stopPropagation(); onToggleCamera(); }}
                className="p-2.5 px-4 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white rounded-2xl transition-all flex flex-col items-center gap-1 group/btn"
                title="Flip Camera (Front/Back)"
            >
                <RefreshCcw size={18} className="group-hover/btn:rotate-180 transition-transform duration-500" />
                <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
                    {facing === 'front' ? 'Front' : 'Back'}
                </span>
            </button>

            {/* Rotation Dropdown */}
            <div className="relative">
                <button
                    onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'rotation' ? null : 'rotation'); }}
                    className={`p-2.5 px-4 rounded-2xl transition-all flex flex-col items-center gap-1 group/btn ${activeDropdown === 'rotation' ? 'bg-primary text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                    title="Rotate Camera"
                >
                    <RotateCw size={18} className={`${activeDropdown === 'rotation' ? 'rotate-90' : ''} transition-transform duration-300`} />
                    <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
                        {rotation}°
                    </span>
                </button>

                {activeDropdown === 'rotation' && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 min-w-[140px] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
                        {rotationOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => { onSetRotation(opt.value); setActiveDropdown(null); }}
                                className={`w-full px-4 py-2 text-left flex items-center justify-between gap-3 hover:bg-white/10 transition-colors ${rotation === opt.value ? 'text-primary font-bold' : 'text-white/70'}`}
                            >
                                <span className="text-[10px] uppercase tracking-wider">{opt.label}</span>
                                {rotation === opt.value && <Check size={12} />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Quality (Resolution) Dropdown */}
            <div className="relative">
                <button
                    onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'quality' ? null : 'quality'); }}
                    className={`p-2.5 px-4 rounded-2xl transition-all flex flex-col items-center gap-1 group/btn ${activeDropdown === 'quality' ? 'bg-primary text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                    title="Change Resolution"
                >
                    <Settings size={18} className={`${activeDropdown === 'quality' ? 'rotate-45' : ''} transition-transform`} />
                    <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
                        {getResLabel(res)}
                    </span>
                </button>

                {activeDropdown === 'quality' && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 min-w-[140px] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
                        {qualityOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => { onSetQuality(opt.value); setActiveDropdown(null); }}
                                className={`w-full px-4 py-2 text-left flex items-center justify-between gap-3 hover:bg-white/10 transition-colors ${res === opt.value ? 'text-primary font-bold' : 'text-white/70'}`}
                            >
                                <span className="text-[10px] uppercase tracking-wider">{opt.label}</span>
                                {res === opt.value && <Check size={12} />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* FPS Dropdown */}
            <div className="relative">
                <button
                    onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'fps' ? null : 'fps'); }}
                    className={`p-2.5 px-4 rounded-2xl transition-all flex flex-col items-center gap-1 group/btn ${activeDropdown === 'fps' ? 'bg-primary text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                    title="Change Frame Rate"
                >
                    <Zap size={18} className={`${fps > 30 || activeDropdown === 'fps' ? (activeDropdown === 'fps' ? 'text-white' : 'text-primary') : ''} group-hover/btn:scale-110 transition-transform`} />
                    <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
                        {fps === 0 ? 'Auto' : `${fps} FPS`}
                    </span>
                </button>

                {activeDropdown === 'fps' && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 min-w-[140px] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
                        {fpsOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => { onSetFPS(opt.value); setActiveDropdown(null); }}
                                className={`w-full px-4 py-2 text-left flex items-center justify-between gap-3 hover:bg-white/10 transition-colors ${fps === opt.value ? 'text-primary font-bold' : 'text-white/70'}`}
                            >
                                <span className="text-[10px] uppercase tracking-wider">{opt.label}</span>
                                {fps === opt.value && <Check size={12} />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* End Session */}
            <button
                onClick={(e) => { e.stopPropagation(); onEndSession(); }}
                className="p-2.5 px-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all flex flex-col items-center gap-1 group/btn ml-1"
                title="End Session"
            >
                <Square fill="currentColor" size={18} />
                <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">End</span>
            </button>
        </div>
    );
}
