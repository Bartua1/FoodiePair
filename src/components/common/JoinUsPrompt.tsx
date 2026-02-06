import { useTranslation } from 'react-i18next';
import { SignInButton } from '@clerk/clerk-react';

export function JoinUsPrompt() {
    const { t } = useTranslation();

    return (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 z-50 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom duration-500">
            <p className="text-slate-800 font-medium text-center md:text-left text-sm md:text-base">
                {t('joinUs.prompt')}
            </p>
            <SignInButton mode="modal">
                <button className="bg-pastel-peach hover:bg-pastel-peach/90 text-slate-800 font-bold py-2 px-6 rounded-full shadow-sm transition-all active:scale-95 whitespace-nowrap">
                    {t('joinUs.action')}
                </button>
            </SignInButton>
        </div>
    );
}
