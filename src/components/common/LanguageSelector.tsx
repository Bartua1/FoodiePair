import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language.startsWith('en') ? 'es' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/10 dark:bg-white/10 hover:bg-slate-900/20 dark:hover:bg-white/20 backdrop-blur-md border border-slate-900/20 dark:border-white/20 text-slate-900 dark:text-white transition-all active:scale-95 shadow-sm"
            aria-label="Toggle Language"
        >
            <Globe className="w-4 h-4 text-slate-700 dark:text-white/70" />
            <span className="text-xs font-black tracking-wider uppercase">
                {i18n.language.startsWith('en') ? 'EN' : 'ES'}
            </span>
        </button>
    );
};
