import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface RenderDriverOption {
    id: string;
    label: string;
}

export interface RenderDriverSupport {
    hostOs: string;
    supportsRenderDriver: boolean;
    supportedDrivers: RenderDriverOption[];
}

export interface ScrcpyConfig {
    device: string;
    sessionMode: string;
    bitrate?: number;
    fps?: number;
    stayAwake?: boolean;
    turnOff?: boolean;
    audioEnabled?: boolean;
    alwaysOnTop?: boolean;
    fullscreen?: boolean;
    borderless?: boolean;
    record?: boolean;
    recordPath?: string;
    scrcpyPath?: string;
    otgPure?: boolean;
    cameraFacing?: string;
    cameraId?: string;
    codec?: string;
    cameraAr?: string;
    cameraHighSpeed?: boolean;
    vdWidth?: number;
    vdHeight?: number;
    vdDpi?: number;
    rotation?: string;
    res?: string;
    aspectRatioLock?: boolean;
    shortcutMod?: string;
    hoverMonitor?: string;
    hidKeyboard?: boolean;
    hidMouse?: boolean;
    renderDriver?: string;
}

export function useScrcpy() {
    const [devices, setDevices] = useState<string[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [pushProgress, setPushProgress] = useState<{ progress: number, speed: string, eta?: string }>({ progress: 0, speed: '', eta: '' });
    const [activeDevice, setActiveDevice] = useState<string>("");
    const [status, setStatus] = useState<string>("");
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [scrcpyStatus, setScrcpyStatus] = useState<{ found: boolean, message: string }>({ found: false, message: "Checking..." });
    const [isAutoConnect, setIsAutoConnect] = useState<boolean>(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [runningDevices, setRunningDevices] = useState<string[]>([]);
    const [defaultRecordPath, setDefaultRecordPath] = useState<string>("");
    const [detectedCameras, setDetectedCameras] = useState<{ id: string, name: string }[]>([]);
    const [renderDriverSupport, setRenderDriverSupport] = useState<RenderDriverSupport>({
        hostOs: 'unknown',
        supportsRenderDriver: false,
        supportedDrivers: []
    });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const [theme, setTheme] = useState("ultraviolet");
    const [historyDevices, setHistoryDevices] = useState<string[]>([]);
    const [config, setConfig] = useState<ScrcpyConfig>({
        device: "",
        sessionMode: "mirror",
        bitrate: 8,
        fps: 60,
        stayAwake: false,
        turnOff: false,
        audioEnabled: true,
        alwaysOnTop: false,
        res: "0",
        recordPath: "",
        vdWidth: 1920,
        vdHeight: 1080,
        vdDpi: 420,
        aspectRatioLock: true,
        shortcutMod: "lalt,ralt",
        hoverMonitor: "all",
        hidKeyboard: false,
        hidMouse: false
    });
    const prevDevicesRef = useRef<string[]>([]);

    useEffect(() => {
        // Use global listener to ensure events are caught regardless of window scoping
        const unlisten = listen<{ progress: number, speed: string, eta?: string }>('adb-push-progress', (event) => {
            const { progress, speed, eta } = event.payload;
            console.log('[ADB] Progress Update:', progress, speed, eta);
            setPushProgress({ 
                progress: Math.min(progress, 100), 
                speed: speed || '',
                eta: eta || ''
            });
            if (progress >= 100) {
                setTimeout(() => setPushProgress({ progress: 0, speed: '', eta: '' }), 2000);
            }
        });
        return () => { unlisten.then(f => f()); };
    }, []);

    useEffect(() => {
        const savedAuto = localStorage.getItem('scrcpy_auto_connect');
        if (savedAuto !== null) setIsAutoConnect(savedAuto === 'true');

        const savedTheme = localStorage.getItem('scrcpy_theme');
        if (savedTheme) setTheme(savedTheme);

        const savedHistory = localStorage.getItem('scrcpy_history');
        if (savedHistory) {
            try { setHistoryDevices(JSON.parse(savedHistory)); } 
            catch (e) { console.error("Failed to parse history", e); }
        }

        const savedConfig = localStorage.getItem('scrcpy_config');
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig);
                setConfig(prev => ({ ...prev, ...parsed }));
                if (parsed.scrcpyPath) checkScrcpy(parsed.scrcpyPath);
            } catch (e) { console.error("Failed to parse saved config", e); }
        }

        const initPaths = async () => {
            try {
                const defaultDir: string = await invoke('get_videos_dir');
                setDefaultRecordPath(defaultDir);
                setConfig(prev => {
                    if (!prev.recordPath) return { ...prev, recordPath: defaultDir };
                    return prev;
                });
                return defaultDir;
            } catch (e) { console.error("Failed to fetch videos dir", e); return ""; }
        };

        const initStart = async () => {
            await initPaths();
            setIsInitialized(true);
        };
        initStart();
    }, []);

    // Persist changes
    useEffect(() => {
        if (!isInitialized) return;
        localStorage.setItem('scrcpy_config', JSON.stringify(config));
    }, [config, isInitialized]);

    useEffect(() => {
        if (!isInitialized) return;
        localStorage.setItem('scrcpy_theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme, isInitialized]);

    // Clear detected cameras when device changes
    useEffect(() => {
        setDetectedCameras([]);
    }, [activeDevice]);

    const hasAutoConnectedRef = useRef(false);

    const getErrorMessage = (e: unknown): string => {
        if (e instanceof Error) return e.message;
        if (typeof e === 'string') return e;
        if (e && typeof e === 'object' && 'message' in e) return String((e as any).message);
        if (e && typeof e === 'object' && 'error' in e) return String((e as any).error);
        return String(e);
    };

    // Automatic connection logic
    useEffect(() => {
        if (!isInitialized || !isAutoConnect || !scrcpyStatus.found || devices.length > 0 || isRefreshing || hasAutoConnectedRef.current) return;

        const autoConnectAll = async () => {
            if (historyDevices.length > 0) {
                hasAutoConnectedRef.current = true;
                setLogs(prev => [...prev.slice(-100), `[SYSTEM] Auto-connect active. Attempting to reach ${historyDevices.length} known devices...`]);
                for (const ip of historyDevices) {
                    if (devices.includes(ip)) continue;
                    await connectDevice(ip);
                }
            }
        };

        const timer = setTimeout(autoConnectAll, 2000); 
        return () => clearTimeout(timer);
    }, [isInitialized, isAutoConnect, scrcpyStatus.found, historyDevices, devices.length, isRefreshing]);

    const toggleAutoConnect = (val: boolean) => {
        setIsAutoConnect(val);
        localStorage.setItem('scrcpy_auto_connect', val.toString());
    };

    useEffect(() => {
        const unlistenLog = listen<string>('scrcpy-log', (event) => {
            const newLines = event.payload.split('\n');
            setLogs(prev => [...prev.slice(-(100 - newLines.length)), ...newLines]);
        });

        const unlistenStatus = listen<any>('scrcpy-status', (event) => {
            const data = event.payload;
            if (data.device && typeof data.running === 'boolean') {
                setRunningDevices(prev => {
                    if (data.running) return [...new Set([...prev, data.device])];
                    return prev.filter(d => d !== data.device);
                });
            } else if (data.type === 'downloading') {
                setIsDownloading(true);
                setStatus(data.message);
            } else if (data.type === 'download-progress') {
                setDownloadProgress(data.percent);
            } else if (data.type === 'download-complete') {
                setIsDownloading(false);
                setStatus("Download Complete");
                refreshDevices(data.message);
                checkScrcpy();
            }
        });

        return () => {
            unlistenLog.then(f => f());
            unlistenStatus.then(f => f());
        };
    }, []);

    const addToHistory = (ip: string) => {
        if (!ip.includes(':')) return;
        setHistoryDevices(prev => {
            const next = [ip, ...prev.filter(d => d !== ip)].slice(0, 10);
            localStorage.setItem('scrcpy_history', JSON.stringify(next));
            return next;
        });
    };

    const clearHistory = () => {
        setHistoryDevices([]);
        localStorage.removeItem('scrcpy_history');
    };

    const refreshDevices = async (customPath?: string, silent: boolean = false) => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            const res: any = await invoke('get_devices', { customPath: customPath || config.scrcpyPath });
            if (!res.error) {
                const newDevices = res.devices as string[];
                const prevDevices = prevDevicesRef.current;
                const added = newDevices.filter(d => !prevDevices.includes(d));
                const removed = prevDevices.filter(d => !newDevices.includes(d));

                added.forEach(device => setLogs(prev => [...prev.slice(-100), `[SYSTEM] New device discovered: ${device}`]));
                removed.forEach(device => setLogs(prev => [...prev.slice(-100), `[SYSTEM] Device disconnected: ${device}`]));

                setDevices(newDevices);
                prevDevicesRef.current = newDevices;

                if (!silent && added.length === 0 && removed.length === 0) {
                    setLogs(prev => [...prev.slice(-100), `[SYSTEM] Discovery active: ${newDevices.length} device(s) found.`]);
                }
                if (newDevices.length > 0 && !activeDevice) setActiveDevice(newDevices[0]);
            } else {
                setLogs(prev => [...prev.slice(-100), `[SYSTEM] Discovery error: ${res.message || res.error}`]);
            }
        } catch (e: unknown) {
            const errorMessage = getErrorMessage(e);
            console.error(e);
            setLogs(prev => [...prev.slice(-100), `[SYSTEM] Error refreshing devices: ${errorMessage}`]);
        } finally {
            setIsRefreshing(false);
        }
    };

    const runScrcpy = async (config: ScrcpyConfig) => {
        try {
            setLogs(prev => [...prev.slice(-100), `[SYSTEM] Initializing scrcpy session for ${config.device}...`]);
            await invoke('run_scrcpy', { config });
        } catch (e: unknown) {
            const errorMessage = getErrorMessage(e);
            setLogs(prev => [...prev.slice(-100), `[ERROR] Failed to start scrcpy: ${errorMessage}`]);
        }
    };

    const stopScrcpy = async (device: string) => {
        try { 
            await invoke('stop_scrcpy', { device }); 
        } catch (e: unknown) { 
            const errorMessage = getErrorMessage(e);
            console.error(e); 
            setLogs(prev => [...prev.slice(-100), `[ERROR] Failed to stop scrcpy: ${errorMessage}`]);
        }
    };

    const downloadScrcpy = async () => {
        try {
            setIsDownloading(true);
            await invoke('download_scrcpy');
        } catch (e: unknown) {
            const errorMessage = getErrorMessage(e);
            setIsDownloading(false);
            setLogs(prev => [...prev, `Download Error: ${errorMessage}`]);
        }
    };

    const checkScrcpy = async (customPath?: string) => {
        try {
            const pathToCheck = customPath !== undefined ? customPath : config.scrcpyPath;
            const res: any = await invoke('check_scrcpy', { customPath: pathToCheck });
            setScrcpyStatus(res);
            if (res.found) {
                try {
                    const renderRes: any = await invoke('get_render_drivers', { customPath: pathToCheck });
                    setRenderDriverSupport({
                        hostOs: renderRes?.hostOs || 'unknown',
                        supportsRenderDriver: !!renderRes?.supportsRenderDriver,
                        supportedDrivers: Array.isArray(renderRes?.supportedDrivers) ? renderRes.supportedDrivers : []
                    });
                } catch {
                    setRenderDriverSupport({ hostOs: 'unknown', supportsRenderDriver: false, supportedDrivers: [] });
                }
            } else {
                setRenderDriverSupport({ hostOs: 'unknown', supportsRenderDriver: false, supportedDrivers: [] });
            }
            if (!res.found) setIsOnboardingOpen(true);
            return res.found;
        } catch (e: unknown) {
            const errorMessage = getErrorMessage(e);
            setScrcpyStatus({ found: false, message: `Error: ${errorMessage}` });
            return false;
        }
    };

    const pairDevice = async (ip: string, code: string, customPath?: string) => {
        try {
            const res: any = await invoke('adb_pair', { ip, code, customPath: customPath || config.scrcpyPath });
            if (res.success) {
                setLogs(prev => [...prev.slice(-100), `[SYSTEM] Successfully paired with ${ip}`]);
                await refreshDevices(customPath, true);
            } else {
                setLogs(prev => {
                    const msgs = [`[SYSTEM] Pairing failed: ${res.message}`];
                    if (typeof res.message === 'string' && res.message.includes('protocol fault')) {
                        msgs.push(`[TIP] Protocol fault usually means the ADB server is stuck. Try "Kill ADB" in the sidebar.`);
                    }
                    return [...prev.slice(-100), ...msgs];
                });
            }
            return res;
        } catch (e: unknown) {
            const errorMessage = getErrorMessage(e);
            setLogs(prev => [...prev.slice(-100), `[ERROR] Pairing error: ${errorMessage}`]);
            return { success: false, message: errorMessage };
        }
    };

    const connectDevice = async (ip: string, customPath?: string) => {
        setIsRefreshing(true);
        try {
            let res: any = await invoke('adb_connect', { ip, customPath: customPath || config.scrcpyPath });
            if (!res.success && typeof res.message === 'string' && (res.message.includes('failed to connect') || res.message.includes('cannot connect'))) {
                setLogs(prev => [...prev.slice(-100), `[SYSTEM] Connection failed, retrying with cleanup...`]);
                await invoke('run_terminal_command', { cmd: `adb disconnect ${ip}`, customPath: customPath || config.scrcpyPath });
                await new Promise(r => setTimeout(r, 500));
                res = await invoke('adb_connect', { ip, customPath: customPath || config.scrcpyPath });
            }

            if (res.success) {
                setLogs(prev => [...prev.slice(-100), `[SYSTEM] CONNECTED TO ${ip} SUCCESSFULLY.`]);
                addToHistory(ip);
                await new Promise(r => setTimeout(r, 1000));
                setIsRefreshing(false);
                await refreshDevices(customPath || config.scrcpyPath, true);
            } else {
                setLogs(prev => {
                    const msgs = [`[SYSTEM] Connection failed: ${res.message}`];
                    if (typeof res.message === 'string' && (res.message.includes('failed to connect') || res.message.includes('cannot connect'))) {
                        msgs.push(`[TIP] Port might be stale. Try "Kill ADB" to refresh discovery.`);
                    }
                    return [...prev.slice(-100), ...msgs];
                });
            }
            return res;
        } catch (e: unknown) {
            const errorMessage = getErrorMessage(e);
            setLogs(prev => [...prev.slice(-100), `[ERROR] Connection error: ${errorMessage}`]);
            return { success: false, message: errorMessage };
        } finally {
            setIsRefreshing(false);
        }
    };

    const listScrcpyOptions = async (device: string, arg: string, customPath?: string) => {
        try {
            setLogs(prev => [...prev.slice(-100), `Running scrcpy ${arg}...`]);
            const res: any = await invoke('list_scrcpy_options', { device, arg, customPath: customPath || config.scrcpyPath });
            if (res.output) {
                const lines = res.output.split('\n');
                setLogs(prev => [...prev.slice(-100), ...lines]);
                if (arg === '--list-cameras') {
                    const cameras: { id: string, name: string }[] = [];
                    lines.forEach((line: string) => {
                        const trimmedLine = line.trim();
                        const newMatch = trimmedLine.match(/--camera-id=(\w+)\s*\((.*?)\)/);
                        const oldMatch = trimmedLine.match(/^(?:-\s*)?\[(\w+)\]\s*\((.*?)\)\s*(.*)/);
                        if (newMatch) {
                            cameras.push({ id: newMatch[1], name: `${newMatch[1]}: ${newMatch[2]}` });
                        } else if (oldMatch) {
                            const metadata = oldMatch[3].replace(/\r$/, '').trim();
                            cameras.push({ id: oldMatch[1], name: `${oldMatch[1]}: ${metadata || 'Camera'} (${oldMatch[2]})` });
                        }
                    });
                    if (cameras.length > 0) setDetectedCameras(cameras);
                    else setLogs(prev => [...prev, "[SYSTEM] No cameras parsed from output. Please check the console above."]);
                }
            }
            return res;
        } catch (e: unknown) {
            const errorMessage = getErrorMessage(e);
            setLogs(prev => [...prev.slice(-100), `Error: ${errorMessage}`]);
            return { success: false, message: errorMessage };
        }
    };

    const pushFile = async (device: string, filePath: string, customPath?: string) => {
        try {
            setPushProgress({ progress: 1, speed: 'Starting...' });
            setLogs(prev => [...prev.slice(-100), `[SYSTEM] Pushing file to ${device}: ${filePath}...`]);
            const res: any = await invoke('push_file', { device, filePath, customPath: customPath || config.scrcpyPath });
            setLogs(prev => [...prev.slice(-100), `[ADB] ${res.message}`]);
            if (!res.success) setPushProgress({ progress: 0, speed: '' });
            else {
                setPushProgress({ progress: 100, speed: 'Complete' });
                setTimeout(() => setPushProgress({ progress: 0, speed: '' }), 2000);
            }
            return res;
        } catch (e: unknown) {
            const errorMessage = getErrorMessage(e);
            setPushProgress({ progress: 0, speed: '' });
            setLogs(prev => [...prev.slice(-100), `Error: ${errorMessage}`]);
            return { success: false, message: errorMessage };
        }
    };

    const installApk = async (device: string, filePath: string, customPath?: string) => {
        try {
            setPushProgress({ progress: 1, speed: 'Preparing...' });
            setLogs(prev => [...prev.slice(-100), `[SYSTEM] Installing APK on ${device}: ${filePath}...`]);
            const res: any = await invoke('install_apk', { device, filePath, customPath: customPath || config.scrcpyPath });
            setLogs(prev => [...prev.slice(-100), `[ADB] ${res.message}`]);
            if (res.success) {
                setPushProgress({ progress: 100, speed: 'Done' });
                setTimeout(() => setPushProgress({ progress: 0, speed: '' }), 2000);
            } else setPushProgress({ progress: 0, speed: '' });
            return res;
        } catch (e: unknown) {
            const errorMessage = getErrorMessage(e);
            setPushProgress({ progress: 0, speed: '' });
            setLogs(prev => [...prev.slice(-100), `Error: ${errorMessage}`]);
            return { success: false, message: errorMessage };
        }
    };

    const runTerminalCommand = async (command: string, customPath?: string) => {
        try {
            const lower = command.trim().toLowerCase();
            const prefix = (lower.startsWith('scrcpy') || lower.startsWith('adb')) ? '' : 'adb ';
            setLogs(prev => [...prev.slice(-100), `> ${prefix}${command}`]);
            const res: any = await invoke('run_terminal_command', { device: activeDevice, cmd: command, customPath: customPath || config.scrcpyPath });
            if (res.stdout) {
                const lines = res.stdout.trim().split('\n');
                setLogs(prev => [...prev.slice(-100), ...lines]);
            }
            if (res.stderr) {
                const lines = res.stderr.trim().split('\n').map((l: string) => `[${res.binary?.toUpperCase() || 'ERR'}] ${l}`);
                setLogs(prev => [...prev.slice(-100), ...lines]);
            }
            return res;
        } catch (e: unknown) {
            const errorMessage = getErrorMessage(e);
            setLogs(prev => [...prev.slice(-100), `[ERROR] Command failed: ${errorMessage}`]);
            return { success: false, message: errorMessage };
        }
    };

    const clearLogs = () => setLogs([]);

    return {
        devices,
        logs,
        setLogs,
        clearLogs,
        isDownloading,
        downloadProgress,
        status,
        refreshDevices,
        runScrcpy,
        stopScrcpy,
        downloadScrcpy,
        activeDevice,
        setActiveDevice,
        checkScrcpy,
        scrcpyStatus,
        pairDevice,
        connectDevice,
        listScrcpyOptions,
        runTerminalCommand,
        isAutoConnect,
        toggleAutoConnect,
        runningDevices,
        defaultRecordPath,
        detectedCameras,
        renderDriverSupport,
        isRefreshing,
        config,
        setConfig,
        theme,
        setTheme,
        pushFile,
        installApk,
        historyDevices,
        clearHistory,
        sessionRunning: runningDevices.includes(activeDevice || ''),
        isOnboardingOpen,
        setIsOnboardingOpen,
        pushProgress,
        completeOnboarding: () => {
            localStorage.setItem('scrcpy_onboarding_done', 'true');
            setIsOnboardingOpen(false);
        }
    };
}
