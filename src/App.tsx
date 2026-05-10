import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-dialog";
import Sidebar from "./components/Sidebar";
import ControlPanel from "./components/ControlPanel";
import CameraControls from "./components/CameraControls";
import Header from "./components/Header";
import LogPanel from "./components/LogPanel";
import SessionBehavior from "./components/SessionBehavior";
import ShortcutsPanel from "./components/ShortcutsPanel";
import ErrorBoundary from "./components/ErrorBoundary";
import OnboardingModal from "./components/OnboardingModal";
import ThemedModal from "./components/ThemedModal";
import HoverTrigger from "./components/HoverTrigger";
import { useScrcpy } from "./hooks/useScrcpy";
import { getVersion } from '@tauri-apps/api/app';

function App() {
  const [windowLabel, setWindowLabel] = useState<string | null>(null);

  useEffect(() => {
    // 1. Try Tauri label
    let label = getCurrentWindow().label;
    
    // 2. Fallback to URL parameter (foolproof for multi-window)
    const urlParams = new URLSearchParams(window.location.search);
    const urlLabel = urlParams.get('label');
    
    if (urlLabel) {
      label = urlLabel;
    }

    console.log('[APP] Final window label resolution:', label);
    setWindowLabel(label);
  }, []);

  if (windowLabel && windowLabel.startsWith('hover-trigger')) {
    return (
      <div className="min-h-screen bg-transparent overflow-hidden">
        <HoverTrigger />
      </div>
    );
  }

  if (windowLabel === 'splashscreen') {
    return null;
  }

  // If we haven't found the label yet, or it's 'main', render the main app
  if (windowLabel === null) {
    return <div className="min-h-screen bg-zinc-950" />;
  }

  return <MainApp />;
}

function MainApp() {
  const {
    devices,
    logs,
    activeDevice,
    setActiveDevice,
    refreshDevices,
    runScrcpy,
    stopScrcpy,
    downloadScrcpy,
    checkScrcpy,
    scrcpyStatus,
    setLogs,
    isDownloading,
    downloadProgress,
    pairDevice,
    connectDevice,
    runTerminalCommand,
    isAutoConnect,
    toggleAutoConnect,
    runningDevices,
    isRefreshing,
    sessionRunning,
    clearLogs,
    detectedCameras,
    renderDriverSupport,
    config,
    setConfig,
    theme,
    setTheme,
    pushFile,
    installApk,
    historyDevices,
    clearHistory,
    isOnboardingOpen,
    setIsOnboardingOpen,
    completeOnboarding,
    pushProgress,
    listScrcpyOptions
  } = useScrcpy();

  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    kind: 'warning' | 'error' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    kind: 'info'
  });

  const [appVersion, setAppVersion] = useState("3.3.0");

  const showAlert = (title: string, message: string, kind: 'warning' | 'error' | 'info' | 'success' = 'info') => {
    setAlertState({ isOpen: true, title, message, kind });
  };

  useEffect(() => {
    if (activeDevice && config.sessionMode === 'camera') {
      listScrcpyOptions(activeDevice, '--list-cameras');
    }
    // When switching back to mirror or desktop, ensure audio is enabled by default
    // to avoid the "weird" behavior where users have to manually re-enable it.
    if (config.sessionMode !== 'camera') {
      if (config.audioSource === 'mic') {
        setConfig(prev => ({ ...prev, audioSource: 'output', audioEnabled: true, audioPlayback: true }));
      }
    }
  }, [activeDevice, config.sessionMode]);

  useEffect(() => {
    // Initial setup: fetch version and close splashscreen
    const initApp = async () => {
      try {
        const v = await getVersion();
        setAppVersion(v);

        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('close_splashscreen');
      } catch (e) {
        console.error("Initialization failed:", e);
      }
    };

    const timer = setTimeout(initApp, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Initial check (once on mount) - Silent to avoid log clatter
    checkScrcpy(config.scrcpyPath);
    refreshDevices(config.scrcpyPath, true);
  }, []);

  useEffect(() => {
    // Global Drag and Drop Listener (re-bind only if activeDevice changes)
    const unlisten = getCurrentWindow().listen<{ paths: string[] }>("tauri://drag-drop", async (event) => {
      if (!activeDevice) {
        setLogs(prev => [...prev.slice(-100), "[WARN] No device selected for drag-and-drop operation."]);
        return;
      }

      const paths = event.payload.paths;
      if (paths && paths.length > 0) {
        for (const path of paths) {
          await handleFileOperation(path);
        }
      }
    });

    return () => {
      unlisten.then(f => f());
    };
  }, [activeDevice]);

  useEffect(() => {
    if (activeDevice) {
      setConfig(prev => ({ ...prev, device: activeDevice }));
    }
  }, [activeDevice]);

  const handleStart = async () => {
    if (!activeDevice) {
      showAlert("No Device Selected", "Please select a device from the sidebar to continue. Hint: If you just connected your phone, click 'Refresh' in the sidebar to update the list.", "warning");
      return;
    }
    await runScrcpy(config);
  };

  const handleStop = async () => {
    if (!activeDevice) return;
    await stopScrcpy(activeDevice);
  };

  const handleRefresh = () => {
    refreshDevices();
  };

  const handleKillAdb = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('kill_adb', { customPath: config.scrcpyPath });
      refreshDevices(config.scrcpyPath);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileOperation = async (path: string) => {
    if (!activeDevice) return;

    const isApk = path.toLowerCase().endsWith('.apk');
    if (isApk) {
      await installApk(activeDevice, path);
    } else {
      await pushFile(activeDevice, path);
    }
  };

  const restartSession = async (newConfig: any) => {
    if (sessionRunning && activeDevice) {
      try {
        await handleStop();
        // A small delay to ensure the previous process has fully cleaned up
        await new Promise(r => setTimeout(r, 600));
        await runScrcpy(newConfig);
      } catch (e) {
        console.error("Failed to restart scrcpy", e);
        setLogs(prev => [...prev.slice(-100), `[ERROR] Failed to restart session.`]);
      }
    }
  };

  const handleToggleMic = async () => {
    const isPhoneMic = config.audioEnabled && config.audioSource === 'mic';
    const newConfig = isPhoneMic 
      ? { ...config, audioEnabled: false, audioSource: 'output' as const }
      : { ...config, audioEnabled: true, audioSource: 'mic' as const };
    
    setConfig(newConfig);
    if (sessionRunning) {
      setLogs(prev => [...prev.slice(-100), `[SYSTEM] Switching to ${!isPhoneMic ? 'Phone' : 'System'} Mic. Restarting session...`]);
      await restartSession(newConfig);
    }
  };

  const handleToggleCamera = async () => {
    const currentFacing = config.cameraFacing || 'back';
    const nextFacing = currentFacing === 'back' ? 'front' : 'back';
    const newConfig = { ...config, cameraFacing: nextFacing };
    
    setConfig(newConfig);
    if (sessionRunning) {
      setLogs(prev => [...prev.slice(-100), `[SYSTEM] Switching camera to ${nextFacing}. Restarting session...`]);
      await restartSession(newConfig);
    }
  };

  const handleSetRotation = async (rotation: string) => {
    const newConfig = { ...config, rotation };
    
    setConfig(newConfig);
    if (sessionRunning) {
      setLogs(prev => [...prev.slice(-100), `[SYSTEM] Rotating camera to ${rotation}°. Restarting session...`]);
      await restartSession(newConfig);
    }
  };

  const handleSetQuality = async (res: string) => {
    const newConfig = { ...config, res };
    setConfig(newConfig);
    if (sessionRunning) {
      setLogs(prev => [...prev.slice(-100), `[SYSTEM] Switching resolution to ${res === '0' ? 'Original' : res}. Restarting session...`]);
      await restartSession(newConfig);
    }
  };

  const handleSetFPS = async (fps: number) => {
    const newConfig = { ...config, fps };
    setConfig(newConfig);
    if (sessionRunning) {
      setLogs(prev => [...prev.slice(-100), `[SYSTEM] Switching frame rate to ${fps === 0 ? 'Auto' : fps} FPS. Restarting session...`]);
      await restartSession(newConfig);
    }
  };

  const handleFileBrowse = async () => {
    if (!activeDevice) return;
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: 'All Files',
            extensions: ['*']
          },
          {
            name: 'Android App (APK)',
            extensions: ['apk']
          }
        ]
      });

      if (selected) {
        if (Array.isArray(selected)) {
          for (const path of selected) {
            await handleFileOperation(path);
          }
        } else {
          await handleFileOperation(selected);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetPath = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: config.scrcpyPath || undefined
      });
      if (selected && typeof selected === 'string') {
        setConfig(prev => ({ ...prev, scrcpyPath: selected }));
        setLogs(prev => [...prev.slice(-100), `[SYSTEM] Custom scrcpy path set to: ${selected}`]);
        // Trigger a check with the new path
        setTimeout(() => checkScrcpy(selected), 100);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetPath = async () => {
    setConfig(prev => ({ ...prev, scrcpyPath: undefined }));
    setLogs(prev => [...prev.slice(-100), `[SYSTEM] Custom scrcpy path cleared. Using system default.`]);
    // Trigger a check with no custom path
    setTimeout(() => checkScrcpy(undefined), 100);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen font-sans selection:bg-primary/30 selection:text-primary overflow-hidden flex flex-col transition-all duration-500" style={{ backgroundColor: 'var(--bg-base)' }}>
        
        {/* Modern Canvas Background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="canvas-bg absolute inset-0 transition-opacity duration-1000" />
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 flex flex-col h-screen">
          <Header
            onThemeChange={setTheme}
            currentTheme={theme}
            binaryStatus={scrcpyStatus}
            onDownload={downloadScrcpy}
            onSetPath={handleSetPath}
            onResetPath={handleResetPath}
            isDownloading={isDownloading}
            downloadProgress={downloadProgress}
            version={appVersion}
          />

          <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              
              {/* Top Row: Device Hub, Controls, & Shortcuts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: Sidebar + Behavior */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                  <Sidebar
                    devices={devices}
                    runningDevices={runningDevices}
                    onRefresh={handleRefresh}
                    onKillAdb={handleKillAdb}
                    selectedDevice={activeDevice}
                    onSelectDevice={setActiveDevice}
                    onPair={pairDevice}
                    onConnect={connectDevice}
                    isAutoConnect={isAutoConnect}
                    onToggleAuto={toggleAutoConnect}
                    isRefreshing={isRefreshing}
                    onFilePush={handleFileBrowse}
                    historyDevices={historyDevices}
                    clearHistory={clearHistory}
                    pushProgress={pushProgress}
                  />
                  <SessionBehavior config={config} setConfig={setConfig} />
                </div>

                {/* MIDDLE & RIGHT COMBINED: Primary Controls + Shortcuts */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                  <ControlPanel
                    config={config}
                    setConfig={setConfig}
                    onStart={handleStart}
                    onStop={handleStop}
                    isRunning={sessionRunning}
                    detectedCameras={detectedCameras}
                    renderDriverSupport={renderDriverSupport}
                    scrcpyStatus={scrcpyStatus}
                  />
                  <div className="h-[280px]">
                    <ShortcutsPanel />
                  </div>
                </div>

                {/* BOTTOM ROW: System Console (Full Width) */}
                <div className="lg:col-span-12 xl:col-span-12">
                  <div className="min-h-[300px]">
                    <LogPanel
                      logs={logs}
                      onClear={clearLogs}
                      onAddLog={(msg) => setLogs((prev: string[]) => [...prev.slice(-100), msg])}
                      onRunCommand={runTerminalCommand}
                    />
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>

        <OnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          binaryStatus={scrcpyStatus}
          onDownload={downloadScrcpy}
          isDownloading={isDownloading}
          downloadProgress={downloadProgress}
          onComplete={completeOnboarding}
        />

        <ThemedModal
          isOpen={alertState.isOpen}
          onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
          title={alertState.title}
          message={alertState.message}
          kind={alertState.kind}
        />

        {sessionRunning && config.sessionMode === 'camera' && (
          <CameraControls 
            config={config} 
            onToggleMic={handleToggleMic} 
            onToggleCamera={handleToggleCamera}
            onSetRotation={handleSetRotation}
            onSetQuality={handleSetQuality}
            onSetFPS={handleSetFPS}
            onEndSession={handleStop} 
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
