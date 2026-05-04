import { Github, Youtube, Globe, Heart, Coffee } from 'lucide-react';

export default function Footer({ version }: { version: string }) {
    return (
        <footer className="w-full px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-main/5 relative z-10">
            <div className="flex items-center gap-8">
                <a href="https://github.com/kil0bit-kb" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-main transition-colors">
                    <Github size={20} />
                </a>
                <a href="https://www.youtube.com/@kilObit" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-main transition-colors">
                    <Youtube size={20} />
                </a>
                <a href="https://kil0bit.blogspot.com/" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-main transition-colors">
                    <Globe size={20} />
                </a>
                <a href="https://www.patreon.com/cw/KB_kilObit" target="_blank" rel="noopener noreferrer" className="text-primary hover:scale-110 transition-all">
                    <Coffee size={20} />
                </a>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-medium text-secondary">
                <span>Version {version}</span>
                <span className="w-1 h-1 rounded-full bg-main/10" />
                <span className="flex items-center gap-1.5">
                    Made with <Heart size={12} className="text-red-500 fill-red-500" /> by KB
                </span>
            </div>
        </footer>
    );
}
