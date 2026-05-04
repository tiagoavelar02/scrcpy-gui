import React, { useState } from 'react';

interface TooltipProps {
    text: string;
    children?: React.ReactNode;
    placement?: 'top' | 'bottom';
}

export default function Tooltip({ text, children, placement = 'top' }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative inline-flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            <span className="text-[11px] font-bold text-primary/60 cursor-help transition-colors hover:text-primary">
                {children || "(?)"}
            </span>

            {isVisible && (
                <div className={`absolute left-1/2 -translate-x-1/2 w-52 p-3 bg-white/90 dark:bg-black/90 border border-main/5 rounded-2xl shadow-2xl z-[100] text-center backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 ${placement === 'top'
                        ? 'bottom-full mb-3'
                        : 'top-full mt-3'
                    }`}>
                    <p className="text-[11px] text-main/80 font-medium leading-relaxed">{text}</p>
                </div>
            )}
        </div>
    );
}
