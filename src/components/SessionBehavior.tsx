import { open } from '@tauri-apps/plugin-dialog';
import { ScrcpyConfig } from '../hooks/useScrcpy';
import { Coffee, MonitorOff, Volume2, Layers, Maximize, Square, Circle, Folder, Settings2, LucideIcon } from 'lucide-react';

interface SessionBehaviorProps {
    config: ScrcpyConfig;
    setConfig: (c: ScrcpyConfig) => void;
}

export default function SessionBehavior({ config, setConfig }: SessionBehaviorProps) {
    const handleChange = <K extends keyof ScrcpyConfig>(field: K, value: ScrcpyConfig[K]) => {
        const newConfig = { ...config, [field]: value };
        setConfig(newConfig);
        if (field === 'recordPath') {
            localStorage.setItem('scrcpy_record_path', value as string);
        }
    };

    const handlePickFolder = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: 'Select Recording Folder'
            });
            if (selected) {
                handleChange('recordPath', selected);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const Toggle = ({ checked, onChange, icon: Icon, label, danger = false }: { checked: boolean, onChange: (v: boolean) => void, icon: LucideIcon, label: string, danger?: boolean }) => (
        <div
            onClick={() => onChange(!checked)}
            className="flex items-center justify-between p-2.5 rounded-[18px] cursor-pointer hover:bg-main/5 transition-all group"
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className={`p-1.5 rounded-xl transition-colors ${checked ? (danger ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary') : 'bg-main/10 text-secondary group-hover:text-main'}`}>
                    <Icon size={16} />
                </div>
                <span className={`text-xs font-semibold truncate ${checked ? 'text-main' : 'text-secondary'}`}>
                    {label}
                </span>
            </div>
            <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${checked ? (danger ? 'bg-red-500' : 'bg-primary') : 'bg-main/20 ring-1 ring-main/10 dark:bg-white/10 dark:ring-white/10'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${checked ? 'left-4.5' : 'left-0.5'}`} />
            </div>
        </div>
    );

    return (
        <div className="glass-card p-5 rounded-[32px] space-y-4">
            <div className="flex items-center gap-2 px-1">
                <Settings2 size={18} className="text-primary" />
                <h2 className="text-sm font-bold text-main">Behavior</h2>
            </div>

            <div className="space-y-0.5">
                <Toggle
                    checked={config.stayAwake || false}
                    onChange={(v) => handleChange('stayAwake', v)}
                    icon={Coffee}
                    label="Stay Awake"
                />
                <Toggle
                    checked={config.turnOff || false}
                    onChange={(v) => handleChange('turnOff', v)}
                    icon={MonitorOff}
                    label="Screen Off"
                />
                <Toggle
                    checked={config.audioEnabled || false}
                    onChange={(v) => handleChange('audioEnabled', v)}
                    icon={Volume2}
                    label="Forward Audio"
                />
                <Toggle
                    checked={config.alwaysOnTop || false}
                    onChange={(v) => handleChange('alwaysOnTop', v)}
                    icon={Layers}
                    label="Always On Top"
                />
                <Toggle
                    checked={config.fullscreen || false}
                    onChange={(v) => handleChange('fullscreen', v)}
                    icon={Maximize}
                    label="Full Screen"
                />
                <Toggle
                    checked={config.borderless || false}
                    onChange={(v) => handleChange('borderless', v)}
                    icon={Square}
                    label="Borderless"
                />
                <Toggle
                    checked={config.record || false}
                    onChange={(v) => handleChange('record', v)}
                    icon={Circle}
                    label="Record"
                    danger={true}
                />
            </div>

            <div className="pt-3 border-t border-main/5 space-y-2 px-1">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Release Hotkey</span>
                    <select
                        value={config.shortcutMod || 'lalt,ralt'}
                        onChange={(e) => handleChange('shortcutMod', e.target.value)}
                        className="bg-main/5 border-none rounded-lg px-2 py-1 text-[10px] text-main font-bold outline-none cursor-pointer hover:bg-main/10 transition-all"
                    >
                        <option value="lalt,ralt">Alt</option>
                        <option value="lsuper,rsuper">Super/Win</option>
                        <option value="lctrl,rctrl">Ctrl</option>
                    </select>
                </div>
            </div>

            <div className="pt-3 border-t border-main/5 space-y-2 px-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-secondary">
                        <Folder size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Storage</span>
                    </div>
                    <button
                        onClick={handlePickFolder}
                        className="text-[10px] font-bold text-primary hover:underline"
                    >
                        Change
                    </button>
                </div>
                <div className="bg-main/5 rounded-xl px-3 py-1.5 border border-transparent hover:border-main/5 transition-all">
                    <p className="text-[10px] text-secondary font-medium truncate">
                        {config.recordPath || 'Default Videos Folder'}
                    </p>
                </div>
            </div>
        </div>
    );
}
