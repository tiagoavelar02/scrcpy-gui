import { X, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import React from 'react';

type ModalKind = 'warning' | 'error' | 'info' | 'success';

interface ThemedModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    kind?: ModalKind;
    actionLabel?: string;
    onAction?: () => void;
}

export default function ThemedModal({
    isOpen,
    onClose,
    title,
    message,
    kind = 'info',
    actionLabel = 'OK',
    onAction
}: ThemedModalProps) {
    if (!isOpen) return null;

    const config = {
        warning: {
            icon: <AlertTriangle size={32} className="text-amber-500" />,
            bg: 'bg-amber-500/10',
            button: 'bg-amber-500'
        },
        error: {
            icon: <AlertCircle size={32} className="text-red-500" />,
            bg: 'bg-red-500/10',
            button: 'bg-red-500'
        },
        info: {
            icon: <Info size={32} className="text-primary" />,
            bg: 'bg-primary/10',
            button: 'bg-primary'
        },
        success: {
            icon: <CheckCircle2 size={32} className="text-emerald-500" />,
            bg: 'bg-emerald-500/10',
            button: 'bg-emerald-500'
        }
    };

    const current = config[kind];

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center p-6"
            onClick={handleBackdropClick}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xl animate-in fade-in duration-500"></div>

            {/* Modal Container */}
            <div className="relative w-full max-w-sm glass-card rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col">

                {/* Close Button */}
                <div className="absolute top-6 right-6 z-10">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-main/5 text-secondary hover:text-main transition-all active:scale-90"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-10 flex flex-col items-center text-center">
                    {/* Icon */}
                    <div className={`w-20 h-20 rounded-[28px] ${current.bg} flex items-center justify-center mb-8`}>
                        {current.icon}
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-main mb-4 tracking-tight">
                        {title}
                    </h3>
                    <p className="text-secondary font-medium leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="p-8 pt-0">
                    <button
                        onClick={() => {
                            if (onAction) onAction();
                            onClose();
                        }}
                        className={`w-full py-4 ${current.button} text-white rounded-2xl font-bold shadow-xl shadow-current/20 hover:shadow-current/30 active:scale-[0.98] transition-all`}
                    >
                        {actionLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
