import { CheckCircle2, Download, Cpu, ArrowRight, X } from 'lucide-react';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    binaryStatus: { found: boolean; message: string };
    onDownload: () => void;
    isDownloading: boolean;
    downloadProgress: number;
    onComplete: () => void;
}

export default function OnboardingModal({
    isOpen,
    onClose,
    binaryStatus,
    onDownload,
    isDownloading,
    downloadProgress,
    onComplete
}: OnboardingModalProps) {
    if (!isOpen) return null;

    const isReady = binaryStatus.found;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 overflow-hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xl animate-in fade-in duration-700"></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-lg glass-card rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-12 duration-700">
                <div className="absolute top-6 right-6 z-30">
                    <button onClick={onClose} className="p-2.5 bg-main/5 hover:bg-main/10 rounded-full text-secondary hover:text-main transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-10 sm:p-14 text-center">
                    <div className="mb-10">
                        <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                            <Cpu size={40} className="text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold text-main mb-3">Welcome to scrcpyGUI</h2>
                        <p className="text-secondary font-medium leading-relaxed">
                            Let's set up the engine to mirror and control your device.
                        </p>
                    </div>

                    <div className="space-y-10">
                        <div className="space-y-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className={`px-6 py-4 rounded-3xl border-2 transition-all duration-500 flex items-center gap-4 ${isReady
                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600'
                                    : 'bg-main/5 border-transparent text-secondary'
                                    }`}>
                                    {isReady ? (
                                        <CheckCircle2 size={24} className="text-emerald-500" />
                                    ) : (
                                        <Download size={24} className={isDownloading ? 'animate-bounce' : ''} />
                                    )}
                                    <span className="text-sm font-bold">
                                        {isReady ? 'Engine Components Ready' : 'Installation Required'}
                                    </span>
                                </div>

                                {!isReady && (
                                    <div className="w-full space-y-6">
                                        <button
                                            onClick={onDownload}
                                            disabled={isDownloading}
                                            className="w-full py-5 bg-primary text-white rounded-[24px] text-lg font-bold shadow-2xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50"
                                        >
                                            {isDownloading ? (
                                                <span className="flex items-center justify-center gap-3">
                                                    <RefreshCcw size={20} className="animate-spin" />
                                                    Syncing {downloadProgress}%
                                                </span>
                                            ) : (
                                                'Install Core Engine'
                                            )}
                                        </button>

                                        {isDownloading && (
                                            <div className="w-full px-4">
                                                <div className="h-2 bg-main/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${downloadProgress}%` }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-10 border-t border-main/5">
                            <button
                                onClick={onComplete}
                                disabled={!isReady}
                                className={`w-full py-5 rounded-[24px] flex items-center justify-center gap-3 font-bold transition-all ${isReady
                                    ? 'bg-main text-white hover:shadow-xl active:scale-[0.98]'
                                    : 'bg-main/5 text-secondary cursor-not-allowed opacity-50'
                                    }`}
                            >
                                <span>Get Started</span>
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const RefreshCcw = ({ size, className }: { size: number, className: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 16h5v5" />
    </svg>
);
