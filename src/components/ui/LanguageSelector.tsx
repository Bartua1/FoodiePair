import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useUser } from '@clerk/clerk-react';
import { Languages } from 'lucide-react';

export function LanguageSelector() {
    const { i18n, t } = useTranslation();
    const { user } = useUser();

    const changeLanguage = async (lng: string) => {
        i18n.changeLanguage(lng);

        if (user) {
            const { error } = await supabase
                .from('profiles')
                .update({ language: lng })
                .eq('id', user.id);

            if (error) {
                console.error('Error updating language preference:', error);
            }
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-pastel-blue dark:bg-pastel-blue-darker rounded-full flex items-center justify-center text-slate-700 dark:text-white">
                    <Languages size={18} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-zinc-100">{t('settings.language')}</h3>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => changeLanguage('en')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${i18n.language.startsWith('en')
                            ? 'bg-pastel-peach text-slate-800 shadow-sm scale-[1.02]'
                            : 'bg-slate-50 dark:bg-zinc-800 text-slate-400 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700'
                        }`}
                >
                    {t('settings.english')}
                </button>
                <button
                    onClick={() => changeLanguage('es')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${i18n.language.startsWith('es')
                            ? 'bg-pastel-peach text-slate-800 shadow-sm scale-[1.02]'
                            : 'bg-slate-50 dark:bg-zinc-800 text-slate-400 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700'
                        }`}
                >
                    {t('settings.spanish')}
                </button>
            </div>
        </div>
    );
}
