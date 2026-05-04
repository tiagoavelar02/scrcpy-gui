import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow, LogicalPosition, LogicalSize } from "@tauri-apps/api/window";
import { Move } from "lucide-react";

const HoverTrigger = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isGrabbed, setIsGrabbed] = useState(false);
  const lastTriggerRef = useRef<number>(0);
  const window = getCurrentWindow();

  useEffect(() => {
    document.body.style.backgroundColor = 'transparent';
    
    // Listen for configuration toggle
    const unlistenConfig = listen('toggle-hover-config', (event) => {
      const mode = event.payload as boolean;
      console.log('[HOVER] Config toggle:', mode);
      setIsEditMode(mode);
      
      if (!mode) {
        // Reset to corner when exiting edit mode
        resetToCorner();
      }
    });

    // Reliable self-close on session end
    const unlistenClose = listen('close-hover-triggers', () => {
      console.log('[HOVER] Closing window via event');
      window.close();
    });

    return () => {
      document.body.style.backgroundColor = '';
      unlistenConfig.then(f => f());
      unlistenClose.then(f => f());
    };
  }, []);

  const resetToCorner = async () => {
    try {
      // Fallback for currentMonitor missing in this version
      const { availableMonitors } = await import('@tauri-apps/api/window');
      const monitors = await availableMonitors();

      // Try to find the monitor this window is currently on
      let monitor = monitors.length > 0 ? monitors[0] : null;
      try {
          const current = await (window as any).currentMonitor();
          if (current) {
              monitor = current;
          }
      } catch (e) {}

      if (monitor) {
        console.log('[HOVER] Resetting to corner for monitor:', monitor.name);
        const { height } = monitor.size;
        const scale = monitor.scaleFactor;
        const logicalHeight = height / scale;
        const posX = monitor.position.x / scale;
        const posY = (monitor.position.y / scale) + logicalHeight - 60;
        
        await window.setSize(new LogicalSize(60, 60));
        await window.setPosition(new LogicalPosition(posX, posY));
      }
    } catch (e) {
      console.error("[HOVER] Failed to position corner:", e);
    }
  };

  const handleTrigger = () => {
    if (isEditMode) return; 

    const now = Date.now();
    if (now - lastTriggerRef.current > 500) {
      if (!isGrabbed) {
        lastTriggerRef.current = now;
        console.log('[HOVER] Mouse detected, triggering focus...');
        setIsGrabbed(true);
        invoke('focus_scrcpy_window').catch(console.error);
      }
    }
  };

  const handleMouseLeave = () => {
    // When scrcpy grabs the mouse (via our trigger), a synthetic mouseleave
    // event can fire almost immediately because the OS moves the cursor
    // or captures it. We want to ignore that immediate leave so the dot stays.
    const now = Date.now();
    if (now - lastTriggerRef.current > 250) {
      setIsGrabbed(false);
    }
  };

  return (
    <div 
      className={`h-screen w-screen flex flex-col items-center justify-center overflow-hidden select-none cursor-crosshair transition-colors ${isEditMode ? 'border-2 border-primary bg-primary/20 rounded-lg' : 'bg-transparent'}`}
      onMouseMove={handleTrigger}
      onMouseEnter={handleTrigger}
      onMouseLeave={handleMouseLeave}
      onMouseDown={isEditMode ? () => window.startDragging() : undefined}
    >
      {isEditMode && (
        <>
          <Move size={32} className="text-primary animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-tighter text-primary mt-2">
            Resize & Move Me
          </span>
        </>
      )}
      
      {/* Icon: Pulse green dot when grabbed, Purple corner when not grabbed */}
      {!isEditMode && (
        <div className="absolute bottom-0 left-0 w-12 h-12 flex items-end justify-start p-1 group">
          {isGrabbed ? (
            <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute opacity-75"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full relative"></div>
            </div>
          ) : (
            <div className="relative w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity">
              {/* Vertical line of ⌞ */}
              <div className="absolute left-0 bottom-0 w-[3px] h-full bg-primary rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
              {/* Horizontal line of ⌞ */}
              <div className="absolute left-0 bottom-0 h-[3px] w-full bg-primary rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HoverTrigger;
