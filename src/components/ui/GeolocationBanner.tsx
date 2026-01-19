import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GeolocationBannerProps {
    geoError: { message: string } | null;
    retryGeo: () => void;
}

export function GeolocationBanner({ geoError, retryGeo }: GeolocationBannerProps) {
    const { t } = useTranslation();

    if (!geoError) return null;

    return (
        <div className="mt-4 mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                    <h3 className="font-bold text-red-900">{t('app.geolocation.denied')}</h3>
                    <p className="text-sm text-red-700 leading-relaxed">
                        {t('app.geolocation.deniedSubtitle')}
                    </p>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <p className="text-xs text-red-500 italic">
                    {t('app.geolocation.howToHandle')}
                </p>
                <button
                    onClick={retryGeo}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-xl text-sm font-bold text-red-700 hover:bg-red-100 transition-colors shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    {t('app.geolocation.retry')}
                </button>
            </div>
        </div>
    );
}
