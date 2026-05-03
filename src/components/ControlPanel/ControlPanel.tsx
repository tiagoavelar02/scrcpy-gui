import { useState, useEffect, useRef } from 'react';
import { Play, Square, Monitor, Camera, LayoutGrid, ChevronDown, Settings2, Keyboard } from 'lucide-react';
import { RenderDriverSupport, ScrcpyConfig } from '../../hooks/useScrcpy';
import { buildRendererOptions, mapRendererSelection } from './rendererOptions';

interface ControlPanelProps {
    config: ScrcpyConfig;
    setConfig: (c: ScrcpyConfig) => void;
    onStart: () => void;
    onStop: () => void;
    isRunning: boolean;
    detectedCameras?: { id: string, name: string }[];
    renderDriverSupport?: RenderDriverSupport;
}

const BitrateControl = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => {
    const [localValue, setLocalValue] = useState(value);

    // Sync from parent if parent changes externally (e.g. preset load)
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center h-4">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Bitrate</label>
                <span className="text-[10px] font-black text-primary tabular-nums">{localValue}M</span>
            </div>
            <input
                type="range"
                min="1"
                max="50"
                value={localValue}
                onChange={(e) => setLocalValue(parseInt(e.target.value))}
                onMouseUp={() => onChange(localValue)}
                onTouchEnd={() => onChange(localValue)}
                className="w-full h-1 accent-primary bg-zinc-800 rounded-full appearance-none cursor-pointer hover:bg-zinc-700 transition-colors"
            />
        </div>
    );
};

const VDSlider = ({ label, value, min, max, unit = "", onChange }: { label: string, value: number, min: number, max: number, unit?: string, onChange: (val: number) => void }) => {
    const [localValue, setLocalValue] = useState(value);
    useEffect(() => setLocalValue(value), [value]);

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center h-4">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{label}</label>
                <span className="text-[10px] font-black text-primary tabular-nums">{localValue}{unit}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={localValue}
                onChange={(e) => setLocalValue(parseInt(e.target.value))}
                onMouseUp={() => onChange(localValue)}
                className="w-full h-1 accent-primary bg-zinc-800 rounded-full appearance-none cursor-pointer"
            />
        </div>
    );
};

export default function ControlPanel({
    config,
    setConfig,
    onStart,
    onStop,
    isRunning,
    detectedCameras = [],
    renderDriverSupport = { hostOs: 'unknown', supportsRenderDriver: false, supportedDrivers: [] }
}: ControlPanelProps) {
    const handleChange = (field: keyof ScrcpyConfig, value: any) => {
        setConfig({ ...config, [field]: value });
    };

    const rendererOptions = buildRendererOptions(renderDriverSupport);

    const CustomSelect = ({ value, onChange, options, label, className = "" }: { value: any, onChange: (val: any) => void, options: { value: any, label: string }[], label?: string, className?: string }) => {
        const [isOpen, setIsOpen] = useState(false);
        const containerRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };
            if (isOpen) document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [isOpen]);

        const selectedOption = options.find(opt => opt.value === value) || { value, label: "Custom" };

        return (
            <div className={`relative ${className}`} ref={containerRef}>
                {label && <label className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 block px-1">{label}</label>}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full bg-main/5 border border-transparent rounded-xl px-4 py-2.5 text-sm text-main flex items-center justify-between hover:bg-main/10 transition-all group"
                >
                    <span className="font-semibold truncate">{selectedOption?.label}</span>
                    <ChevronDown size={16} className={`text-secondary group-hover:text-primary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white/80 dark:bg-black/80 border border-main/5 rounded-2xl shadow-2xl z-[100] py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200 backdrop-blur-2xl">
                        {options.map((opt) => (
                            <div
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${opt.value === value ? 'bg-primary/10 text-primary font-bold' : 'text-main/70 hover:bg-primary hover:text-white font-medium'}`}
                            >
                                {opt.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const [isConfiguringHover, setIsConfiguringHover] = useState(false);

    useEffect(() => {
        if (isRunning && config.otgPure && (config.hidKeyboard || config.hidMouse)) {
            spawnHoverAreas();
        } else {
            const closeTriggers = async () => {
                const { emit } = await import('@tauri-apps/api/event');
                await emit('close-hover-triggers');
            };
            closeTriggers();
        }
    }, [isRunning, config.otgPure, config.hidKeyboard, config.hidMouse]);

    const spawnHoverAreas = async () => {
        try {
            const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
            const { availableMonitors } = await import('@tauri-apps/api/window');
            const monitors = await availableMonitors();
            
            for (let i = 0; i < monitors.length; i++) {
                const label = `hover-trigger-${i}`;
                let win = await WebviewWindow.getByLabel(label);
                
                if (!win) {
                    const monitor = monitors[i];
                    const scale = monitor.scaleFactor;
                    const logicalHeight = monitor.size.height / scale;
                    const size = 32;
                    const posX = monitor.position.x / scale;
                    const posY = (monitor.position.y / scale) + logicalHeight - size;
                    const baseUrl = window.location.href.split('?')[0].split('#')[0];
                    const url = `${baseUrl}?label=${label}`;
                    
                    new WebviewWindow(label, {
                        url,
                        title: 'Hover to Control',
                        width: size,
                        height: size,
                        resizable: true,
                        decorations: false,
                        alwaysOnTop: true,
                        transparent: true,
                        shadow: false,
                        focusable: false,
                        visible: true,
                        x: posX,
                        y: posY,
                        center: false,
                    });
                } else {
                    await win.show();
                    await win.unminimize();
                }
            }
        } catch (err) {
            console.error('[HOVER] Failed to spawn hover areas:', err);
        }
    };

    const toggleHoverConfig = async () => {
        const { emit } = await import('@tauri-apps/api/event');
        const nextState = !isConfiguringHover;
        setIsConfiguringHover(nextState);
        await emit('toggle-hover-config', nextState);
    };

    const PerformanceGrid = ({ showResolution = true }: { showResolution?: boolean }) => (
        <div className={`grid ${showResolution ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2'} gap-4`}>
            {showResolution && (
                <CustomSelect
                    label="Quality"
                    value={config.res || "0"}
                    onChange={(val) => handleChange('res', val)}
                    options={[
                        { value: "0", label: "Original" },
                        { value: "3840", label: "4K UHD" },
                        { value: "2560", label: "2K QHD" },
                        { value: "1920", label: "1080p HD" },
                        { value: "1280", label: "720p" },
                    ]}
                />
            )}
            <CustomSelect
                label="Frame Rate"
                value={config.fps || 60}
                onChange={(val) => handleChange('fps', parseInt(val))}
                options={[
                    { value: 30, label: "30 FPS" },
                    { value: 60, label: "60 FPS" },
                    { value: 90, label: "90 FPS" },
                    { value: 120, label: "120 FPS" },
                ]}
            />
            <CustomSelect
                label="Graphics"
                value={config.renderDriver || 'auto'}
                onChange={(val) => handleChange('renderDriver', mapRendererSelection(val))}
                options={rendererOptions}
            />
        </div>
    );

    const handleStopSession = async () => {
        try {
            const { emit } = await import('@tauri-apps/api/event');
            const { getAllWindows } = await import('@tauri-apps/api/window');
            await emit('close-hover-triggers');
            await new Promise(r => setTimeout(r, 200));
            const windows = await getAllWindows();
            for (const win of windows) {
                if (win.label.startsWith('hover-trigger-')) {
                    await win.close();
                }
            }
        } catch (e) {
            console.error("[HOVER] Error closing windows:", e);
        }
        onStop();
    };

    return (
        <main className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            {/* Mode Selector Card */}
            <div className="glass-card p-4 rounded-[32px]">
                <div className="bg-main/5 p-1.5 rounded-2xl flex gap-1.5">
                    <button
                        onClick={() => handleChange('sessionMode', 'mirror')}
                        className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-[18px] transition-all ${config.sessionMode === 'mirror' ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-main hover:bg-main/5'}`}
                    >
                        <Monitor size={18} strokeWidth={2.5} />
                        <span className="text-sm font-bold">Screen</span>
                    </button>
                    <button
                        onClick={() => handleChange('sessionMode', 'camera')}
                        className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-[18px] transition-all ${config.sessionMode === 'camera' ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-main hover:bg-main/5'}`}
                    >
                        <Camera size={18} strokeWidth={2.5} />
                        <span className="text-sm font-bold">Camera</span>
                    </button>
                    <button
                        onClick={() => handleChange('sessionMode', 'desktop')}
                        className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-[18px] transition-all ${config.sessionMode === 'desktop' ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-main hover:bg-main/5'}`}
                    >
                        <LayoutGrid size={18} strokeWidth={2.5} />
                        <span className="text-sm font-bold">Desktop</span>
                    </button>
                </div>
            </div>

            {/* Configuration Card */}
            <div className="glass-card p-8 rounded-[40px] space-y-8">
                <div className="flex justify-between items-center border-b border-main/5 pb-4">
                    <h2 className="text-lg font-bold text-main">Session Settings</h2>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isRunning ? 'bg-emerald-500/10 text-emerald-500' : 'bg-main/5 text-secondary'}`}>
                        {isRunning ? 'Active' : 'Ready'}
                    </span>
                </div>

                <div className="space-y-8">
                    {config.sessionMode === 'mirror' && (
                        <>
                            {/* Input Enhancements Widget */}
                            <div className="bg-primary/5 rounded-3xl p-6 space-y-4 border border-primary/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                        <Keyboard size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-main">Input Control</h3>
                                        <p className="text-[11px] text-secondary">Enhance your interaction</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div 
                                        onClick={() => handleChange('hidKeyboard', !config.hidKeyboard)}
                                        className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all border ${config.hidKeyboard ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-main/5 border-transparent hover:bg-main/10'}`}
                                    >
                                        <span className={`text-xs font-bold ${config.hidKeyboard ? 'text-white' : 'text-main/70'}`}>Keyboard (HID)</span>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${config.hidKeyboard ? 'bg-white/30' : 'bg-main/20 ring-1 ring-main/10 dark:bg-white/10 dark:ring-white/10'}`}>
                                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${config.hidKeyboard ? 'left-4.5' : 'left-0.5'}`} />
                                        </div>
                                    </div>
                                    <div 
                                        onClick={() => handleChange('hidMouse', !config.hidMouse)}
                                        className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all border ${config.hidMouse ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-main/5 border-transparent hover:bg-main/10'}`}
                                    >
                                        <span className={`text-xs font-bold ${config.hidMouse ? 'text-white' : 'text-main/70'}`}>Mouse (HID)</span>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${config.hidMouse ? 'bg-white/30' : 'bg-main/20 ring-1 ring-main/10 dark:bg-white/10 dark:ring-white/10'}`}>
                                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${config.hidMouse ? 'left-4.5' : 'left-0.5'}`} />
                                        </div>
                                    </div>
                                </div>

                                {/* Pure HID (No Mirror) Toggle */}
                                {(config.hidKeyboard || config.hidMouse) && (
                                    <div 
                                        onClick={() => handleChange('otgPure', !config.otgPure)}
                                        className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border animate-in slide-in-from-top-2 duration-300 ${config.otgPure ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-primary/5 border-primary/20 hover:bg-primary/10'}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-bold ${config.otgPure ? 'text-white' : 'text-primary'}`}>Pure HID (No Mirror)</span>
                                            <p className={`text-[10px] ${config.otgPure ? 'text-white/80' : 'text-primary/60'}`}>Hides the mirror window</p>
                                        </div>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${config.otgPure ? 'bg-white/30' : 'bg-main/20 ring-1 ring-main/10 dark:bg-white/10 dark:ring-white/10'}`}>
                                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${config.otgPure ? 'left-4.5' : 'left-0.5'}`} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={`space-y-4 transition-all duration-300 ${config.otgPure ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                                <PerformanceGrid />
                                <BitrateControl value={config.bitrate || 8} onChange={(v) => handleChange('bitrate', v)} />
                            </div>
                        </>
                    )}

                    {config.sessionMode === 'camera' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CustomSelect
                                    label="Lens Position"
                                    value={config.cameraFacing || "back"}
                                    onChange={(val) => handleChange('cameraFacing', val)}
                                    options={[
                                        { value: "back", label: "Main (Back)" },
                                        { value: "front", label: "Selfie (Front)" },
                                        { value: "external", label: "External" },
                                    ]}
                                />
                                <CustomSelect
                                    label="Specific Camera"
                                    value={config.cameraId || ""}
                                    onChange={(val) => handleChange('cameraId', val)}
                                    options={[
                                        { value: "", label: "Auto Select" },
                                        ...detectedCameras.map(cam => ({ value: cam.id, label: cam.name }))
                                    ]}
                                />
                                <CustomSelect
                                    label="Video Codec"
                                    value={config.codec || "h264"}
                                    onChange={(val) => handleChange('codec', val)}
                                    options={[
                                        { value: "h264", label: "H.264 (Stable)" },
                                        { value: "h265", label: "H.265 (High Efficiency)" },
                                        { value: "av1", label: "AV1 (Next-Gen)" },
                                    ]}
                                />
                                <CustomSelect
                                    label="Aspect Ratio"
                                    value={config.cameraAr || "0"}
                                    onChange={(val) => handleChange('cameraAr', val)}
                                    options={[
                                        { value: "0", label: "Original" },
                                        { value: "16:9", label: "16:9 Wide" },
                                        { value: "4:3", label: "4:3 Standard" },
                                    ]}
                                />
                            </div>
                            <PerformanceGrid />
                            <BitrateControl value={config.bitrate || 8} onChange={(v) => handleChange('bitrate', v)} />
                        </div>
                    )}

                    {config.sessionMode === 'desktop' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="bg-main/5 rounded-3xl p-5 space-y-4">
                                <div className="flex items-center justify-between border-b border-main/5 pb-2">
                                    <div className="flex items-center gap-2 px-1">
                                        <Settings2 size={14} className="text-primary" />
                                        <h3 className="text-xs font-bold text-main uppercase tracking-widest">Virtual Display</h3>
                                    </div>
                                    <button
                                        onClick={() => handleChange('aspectRatioLock', !config.aspectRatioLock)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${config.aspectRatioLock ? 'bg-primary/10 text-primary' : 'text-secondary hover:text-main hover:bg-main/5'}`}
                                    >
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${config.aspectRatioLock ? 'bg-primary/30' : 'bg-main/20 ring-1 ring-main/10 dark:bg-white/10 dark:ring-white/10'}`}>
                                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${config.aspectRatioLock ? 'left-4.5' : 'left-0.5'}`} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Ratio Lock</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <VDSlider
                                        label="Canvas Width"
                                        value={config.vdWidth || 1920}
                                        min={480} max={3840}
                                        unit="px"
                                        onChange={(val: number) => {
                                            if (config.aspectRatioLock && config.vdWidth && config.vdHeight) {
                                                const ratio = config.vdHeight / config.vdWidth;
                                                setConfig({ ...config, vdWidth: val, vdHeight: Math.round(val * ratio) });
                                            } else {
                                                handleChange('vdWidth', val);
                                            }
                                        }}
                                    />
                                    <VDSlider
                                        label="Canvas Height"
                                        value={config.vdHeight || 1080}
                                        min={360} max={2160}
                                        unit="px"
                                        onChange={(val: number) => {
                                            if (config.aspectRatioLock && config.vdWidth && config.vdHeight) {
                                                const ratio = config.vdWidth / config.vdHeight;
                                                setConfig({ ...config, vdHeight: val, vdWidth: Math.round(val * ratio) });
                                            } else {
                                                handleChange('vdHeight', val);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <PerformanceGrid showResolution={false} />
                            <BitrateControl value={config.bitrate || 8} onChange={(v) => handleChange('bitrate', v)} />
                        </div>
                    )}
                </div>

                {/* Main Action Button */}
                <div className="pt-2">
                    {!isRunning ? (
                        <button
                            onClick={onStart}
                            className="w-full py-4 rounded-[24px] bg-primary text-white text-lg font-bold shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                        >
                            <Play fill="currentColor" size={20} className="group-hover:scale-110 transition-transform" />
                            <span>Start Session</span>
                        </button>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {config.sessionMode === 'mirror' && (config.hidKeyboard || config.hidMouse) && config.otgPure && (
                                <button
                                    onClick={toggleHoverConfig}
                                    className={`py-4 rounded-[22px] border-2 transition-all flex items-center justify-center gap-3 font-bold ${
                                        isConfiguringHover 
                                            ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' 
                                            : 'bg-main/5 border-transparent text-main hover:bg-main/10'
                                    }`}
                                >
                                    <Settings2 size={18} />
                                    <span>{isConfiguringHover ? 'Lock Hover Area' : 'Configure Hover Area'}</span>
                                </button>
                            )}
                            <button
                                onClick={handleStopSession}
                                className={`w-full py-4 rounded-[22px] bg-red-500 text-white font-bold shadow-xl shadow-red-500/20 hover:shadow-red-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 ${
                                    (config.sessionMode !== 'mirror' || !config.otgPure || (!config.hidKeyboard && !config.hidMouse)) ? 'md:col-span-2' : ''
                                }`}
                            >
                                <Square fill="currentColor" size={18} />
                                <span>End Session</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
