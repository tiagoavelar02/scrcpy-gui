import { Maximize, Home, ChevronLeft, List, Power, RotateCw, Clipboard, MonitorOff, Keyboard } from 'lucide-react';

export default function ShortcutsPanel() {
    const shortcuts = [
        { label: "Full", key: "F", icon: Maximize },
        { label: "Home", key: "H", icon: Home },
        { label: "Back", key: "B", icon: ChevronLeft },
        { label: "Recents", key: "S", icon: List },
        { label: "Power", key: "P", icon: Power },
        { label: "Rotate", key: "R", icon: RotateCw },
        { label: "Paste", key: "V", icon: Clipboard },
        { label: "Off", key: "O", icon: MonitorOff },
    ];

    return (
        <div className="glass-card p-5 rounded-[32px] space-y-4">
            <div className="flex items-center gap-2 px-1">
                <Keyboard size={18} className="text-primary" />
                <h2 className="text-sm font-bold text-main">Shortcuts</h2>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
                {shortcuts.map(s => (
                    <div 
                        key={s.key} 
                        className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-main/5 hover:bg-white hover:shadow-lg hover:shadow-main/5 transition-all cursor-help relative"
                        title={s.label}
                    >
                        <s.icon size={16} className="text-secondary group-hover:text-primary transition-colors mb-1.5" />
                        <kbd className="px-1.5 py-0.5 rounded-lg bg-main/10 text-[9px] font-bold text-secondary group-hover:bg-primary/10 group-hover:text-primary transition-all">
                            Alt+{s.key}
                        </kbd>
                    </div>
                ))}
            </div>
        </div>
    );
}
