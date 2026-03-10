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
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-all active:scale-95"
            aria-label="Toggle Language"
        >
            <Globe className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wider uppercase">
                {i18n.language.startsWith('en') ? 'EN' : 'ES'}
            </span>
        </button>
    );
};
