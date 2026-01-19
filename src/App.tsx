import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { UserSync } from './components/auth/UserSync';
import { PairingFlow } from './components/pairing/PairingFlow';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from './lib/supabase';
import type { Profile } from './types';
import { Utensils, Map as MapIcon, List, BarChart2 } from 'lucide-react';
import { RestaurantFAB } from './components/restaurant/RestaurantFAB';
import { AddRestaurantDrawer } from './components/restaurant/AddRestaurantDrawer';
import { useRestaurants } from './hooks/useRestaurants';
import { RestaurantMap } from './components/map/RestaurantMap';
import { FilterBar } from './components/feed/FilterBar';
import { RestaurantCard } from './components/feed/RestaurantCard';
import { calculateDistance } from './lib/distance';
import { PairStats } from './components/stats/PairStats';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';
import { LanguageSelector } from './components/ui/LanguageSelector';
import { useGeolocation } from './hooks/useGeolocation';
import { AlertCircle, RefreshCw } from 'lucide-react';

function App() {
  const { isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center font-medium text-slate-400">{t('app.loading')}</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 bg-white border-b border-pastel-mint flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-pastel-peach rounded-full flex items-center justify-center shadow-sm">
            <Utensils className="w-6 h-6 text-slate-800" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">{t('app.title')}</h1>
        </div>
        <div>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-pastel-peach rounded-full font-medium text-slate-800 text-sm shadow-sm hover:translate-y-[-1px] transition-all">
                {t('app.signIn')}
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <SignedOut>
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto p-4">
            <h2 className="text-3xl font-bold mb-4 text-slate-800">{t('app.heroTitle')}</h2>
            <p className="text-slate-500 mb-8">{t('app.heroSubtitle')}</p>
            <SignInButton mode="modal">
              <button className="px-8 py-3 bg-pastel-peach rounded-full font-bold text-slate-800 shadow-md hover:scale-105 transition-all text-lg">
                {t('app.getStarted')}
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <UserSync>
            <AppContent />
          </UserSync>
        </SignedIn>
      </main>
    </div>
  );
}

function AppContent() {
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [view, setView] = useState<'feed' | 'map' | 'stats' | 'settings'>('feed');
  const { t, i18n } = useTranslation();

  // Geolocation
  const { location: userLocation, error: geoError, retry: retryGeo } = useGeolocation();

  // Filters State
  const [filters, setFilters] = useState({
    distance: 'any',
    price: null as number | null,
    favoritesOnly: false,
    cuisine: 'all'
  });

  useEffect(() => {
    const channel = supabase
      .channel('profile_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user?.id}` },
        (payload) => {
          setProfile(payload.new as Profile);
        })
      .subscribe();

    async function getInitialProfile() {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id);
        if (data && data.length > 0) {
          const profileData = data[0] as Profile;
          setProfile(profileData);
          // Set language from profile if it exists
          if (profileData.language) {
            i18n.changeLanguage(profileData.language);
          }
        }
        setLoading(false);
      }
    }
    getInitialProfile();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, i18n]);

  // Load restaurants
  const { restaurants, loading: resLoading, refresh: refreshRestaurants } = useRestaurants(profile?.pair_id || null);

  // Filter and process restaurants
  const processedRestaurants = useMemo(() => {
    let result = restaurants.map(r => {
      let distance: number | undefined;
      if (userLocation && r.lat && r.lng) {
        distance = calculateDistance(userLocation.lat, userLocation.lng, r.lat, r.lng);
      }
      return { ...r, distance };
    });

    // Apply filters
    if (filters.favoritesOnly) {
      result = result.filter(r => r.is_favorite);
    }
    if (filters.price) {
      result = result.filter(r => r.price_range === filters.price);
    }
    if (filters.cuisine !== 'all') {
      result = result.filter(r => r.cuisine_type === filters.cuisine);
    }
    if (filters.distance !== 'any' && userLocation) {
      const maxDist = parseFloat(filters.distance);
      result = result.filter(r => r.distance !== undefined && r.distance <= maxDist);
    }

    return result;
  }, [restaurants, filters, userLocation]);

  const uniqueCuisines = useMemo(() => {
    const set = new Set(restaurants.map(r => r.cuisine_type).filter(Boolean));
    return Array.from(set) as string[];
  }, [restaurants]);

  if (loading) return <div className="flex-1 flex items-center justify-center font-medium text-slate-400">{t('app.loadingData')}</div>;

  if (!profile?.pair_id) {
    return <div className="p-4"><PairingFlow /></div>;
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col">
        {view === 'feed' ? (
          <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
            <header className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">{t('feed.title')}</h2>
              <p className="text-slate-500 text-sm">{t('feed.subtitle')}</p>
            </header>

            <FilterBar
              filters={filters}
              setFilters={setFilters}
              cuisines={uniqueCuisines}
            />

            {geoError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
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
            )}

            {resLoading ? (
              <div className="animate-pulse space-y-4 mt-6">
                {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-2xl w-full" />)}
              </div>
            ) : processedRestaurants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-20 h-20 bg-pastel-blue rounded-full flex items-center justify-center mb-4">
                  <Utensils className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">{t('feed.noRestaurants')}</h3>
                <p className="text-slate-500 max-w-[240px]">{t('feed.noRestaurantsSubtitle')}</p>
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                {processedRestaurants.map(r => (
                  <RestaurantCard key={r.id} restaurant={r} />
                ))}
              </div>
            )}
          </div>
        ) : view === 'map' ? (
          <div className="flex-1 relative">
            <RestaurantMap restaurants={processedRestaurants} />
            <div className="absolute top-4 left-4 right-4 z-[1000]">
              <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl shadow-lg border border-white/50">
                <FilterBar
                  filters={filters}
                  setFilters={setFilters}
                  cuisines={uniqueCuisines}
                />
              </div>
            </div>
          </div>
        ) : view === 'stats' ? (
          <div className="flex-1 overflow-y-auto">
            <PairStats pairId={profile.pair_id} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <header className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">{t('settings.title')}</h2>
            </header>
            <LanguageSelector />
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="p-4 pt-2 bg-white border-t border-slate-100 flex justify-around gap-2 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setView('feed')}
          className={`flex-1 max-w-[100px] flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${view === 'feed' ? 'bg-pastel-peach text-slate-800 shadow-sm' : 'text-slate-400'}`}
        >
          <List className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Feed</span>
        </button>
        <button
          onClick={() => setView('map')}
          className={`flex-1 max-w-[100px] flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${view === 'map' ? 'bg-pastel-peach text-slate-800 shadow-sm' : 'text-slate-400'}`}
        >
          <MapIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Map</span>
        </button>
        <button
          onClick={() => setView('stats')}
          className={`flex-1 max-w-[100px] flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${view === 'stats' ? 'bg-pastel-peach text-slate-800 shadow-sm' : 'text-slate-400'}`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">{t('nav.stats')}</span>
        </button>
        <button
          onClick={() => setView('settings')}
          className={`flex-1 max-w-[100px] flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${view === 'settings' ? 'bg-pastel-peach text-slate-800 shadow-sm' : 'text-slate-400'}`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">{t('nav.settings')}</span>
        </button>
      </div>

      <RestaurantFAB onClick={() => setIsDrawerOpen(true)} />

      <AddRestaurantDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        profile={profile}
        onSuccess={() => {
          refreshRestaurants();
        }}
      />
    </div>
  );
}

export default App;
