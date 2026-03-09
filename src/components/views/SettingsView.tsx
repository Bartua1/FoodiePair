import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../ui/LanguageSelector';
import { ThemeToggle } from '../common/ThemeToggle';

export function SettingsView() {
    const { t } = useTranslation();

    return (
        <div className="flex-1 overflow-y-auto p-4 pb-32 dark:bg-zinc-950">
            <header className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 mb-1">{t('settings.title')}</h2>
                <ThemeToggle />
            </header>
            <LanguageSelector />
        </div>
    );
}
