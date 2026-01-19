import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { UserSync } from './components/auth/UserSync';
import { PairingFlow } from './components/pairing/PairingFlow';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from './lib/supabase';
import type { Profile, Restaurant } from './types';
import { Utensils } from 'lucide-react';
import { RestaurantFAB } from './components/restaurant/RestaurantFAB';
import { AddRestaurantDrawer } from './components/restaurant/AddRestaurantDrawer';
import { useRestaurants } from './hooks/useRestaurants';
import { calculateDistance } from './lib/distance';
import { useTranslation } from 'react-i18next';
import { useGeolocation } from './hooks/useGeolocation';

// New components
import { TabNavigation, type ViewType } from './components/layout/TabNavigation';
import { FeedView } from './components/views/FeedView';
import { MapView } from './components/views/MapView';
import { StatsView } from './components/views/StatsView';
import { SettingsView } from './components/views/SettingsView';
import { RestaurantDetailView } from './components/views/RestaurantDetailView';

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
  const [view, setView] = useState<ViewType>('feed');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const { i18n } = useTranslation();

  // Geolocation
  const { location: userLocation, error: geoError, retry: retryGeo } = useGeolocation();

  // Filters State
  const [filters, setFilters] = useState({
    distance: 'any',
    price: null as number | null,
    favoritesOnly: false,
    cuisine: 'all',
    sort: 'rating'
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

  const { restaurants, loading: resLoading, refresh: refreshRestaurants } = useRestaurants(profile?.pair_id || null);

  const processedRestaurants = useMemo(() => {
    let result = restaurants.map(r => {
      let distance: number | undefined;
      if (userLocation && r.lat && r.lng) {
        distance = calculateDistance(userLocation.lat, userLocation.lng, r.lat, r.lng);
      }
      return { ...r, distance };
    });

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

    return result.sort((a, b) => {
      if (filters.sort === 'distance') {
        const distA = a.distance ?? Infinity;
        const distB = b.distance ?? Infinity;
        return distA - distB;
      }
      // Default: sort by rating (avg_score)
      const scoreA = a.avg_score || 0;
      const scoreB = b.avg_score || 0;
      return scoreB - scoreA;
    });
  }, [restaurants, filters, userLocation]);

  const uniqueCuisines = useMemo(() => {
    const set = new Set(restaurants.map(r => r.cuisine_type).filter((c): c is string => Boolean(c)));
    return Array.from(set);
  }, [restaurants]);

  if (!profile?.pair_id) {
    return <div className="p-4"><PairingFlow /></div>;
  }

  // If a restaurant is selected, show detail view overlaying/replacing content
  if (selectedRestaurant) {
    return (
      <RestaurantDetailView
        restaurant={selectedRestaurant}
        currentUser={profile}
        onBack={() => setSelectedRestaurant(null)}
      />
    );
  }

  const renderView = () => {
    switch (view) {
      case 'feed':
        return (
          <FeedView
            restaurants={processedRestaurants}
            loading={resLoading}
            filters={filters}
            setFilters={setFilters}
            cuisines={uniqueCuisines}
            geoError={geoError}
            retryGeo={retryGeo}
            onRefresh={refreshRestaurants}
            profile={profile}
            onViewDetails={setSelectedRestaurant}
          />
        );
      case 'map':
        return (
          <MapView
            restaurants={processedRestaurants}
            filters={filters}
            setFilters={setFilters}
            cuisines={uniqueCuisines}
            userLocation={userLocation}
          />
        );
      case 'stats':
        return <StatsView pairId={profile!.pair_id!} />;
      case 'settings':
        return <SettingsView />;
    }
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col">
        {renderView()}
      </div>

      <TabNavigation view={view} setView={setView} />

      <RestaurantFAB onClick={() => setIsDrawerOpen(true)} />

      <AddRestaurantDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        profile={profile}
        onSuccess={refreshRestaurants}
      />
    </div>
  );
}

export default App;
