import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../ui/LanguageSelector';

export function SettingsView() {
    const { t } = useTranslation();

    return (
        <div className="flex-1 overflow-y-auto p-4 pb-32">
            <header className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">{t('settings.title')}</h2>
            </header>
            <LanguageSelector />
        </div>
    );
}
