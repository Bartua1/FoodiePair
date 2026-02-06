import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/clerk-react';
import { UserSync } from './components/auth/UserSync';
import { PairingFlow } from './components/pairing/PairingFlow';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from './lib/supabase';
import type { Profile } from './types';
import { RestaurantFAB } from './components/restaurant/RestaurantFAB';
import { AddRestaurantDrawer } from './components/restaurant/AddRestaurantDrawer';
import { useRestaurants } from './hooks/useRestaurants';
import { calculateDistance } from './lib/distance';
import { useTranslation } from 'react-i18next';
import { useGeolocation } from './hooks/useGeolocation';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// New components
import { NavigationFAB } from './components/layout/NavigationFAB';
import { FeedView } from './components/views/FeedView';
import { MapView } from './components/views/MapView';
import { StatsView } from './components/views/StatsView';
import { SettingsView } from './components/views/SettingsView';
import { RestaurantDetailView } from './components/views/RestaurantDetailView';
import { SharedRestaurantView } from './components/views/SharedRestaurantView';
import { Header } from './components/layout/Header';

function App() {
  const { isLoaded, user } = useUser();
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function getProfile() {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id);
        if (data && data.length > 0) {
          setProfile(data[0] as Profile);
        }
      }
    }
    if (isLoaded) {
      getProfile().then(() => setLoading(false));
    }
  }, [isLoaded, user]);

  const { restaurants } = useRestaurants(profile?.pair_id || null);

  // Calculate unrated restaurants for the current user
  const unratedRestaurants = useMemo(() => {
    return restaurants.filter(r => !r.user_has_rated && r.visit_status !== 'wishlist');
  }, [restaurants]);

  if (loading) return <div className="h-[100dvh] bg-background flex items-center justify-center font-medium text-slate-400">{t('app.loading')}</div>;

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col relative w-full">
        <Routes>
          <Route path="/shared/:id" element={<SharedRestaurantView currentUser={profile} />} />
          <Route path="*" element={
            <div className="flex flex-col h-full">
              <Header unratedRestaurants={unratedRestaurants} />
              <main className="flex-1 flex flex-col overflow-hidden relative">
                <SignedOut>
                  <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto p-4 overflow-y-auto">
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
          } />
        </Routes>
      </div>
    </div>
  );
}

// AppContent remains strictly for authenticated routes and standard layout
function AppContent() {
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

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

  if (loading) {
    return <div className="h-full flex items-center justify-center font-medium text-slate-400">{t('app.loading')}</div>;
  }

  if (!profile?.pair_id) {
    return <div className="p-4"><PairingFlow /></div>;
  }

  // Hide common navigation elements when on details view to give more space/focus
  const isDetailsView = location.pathname.startsWith('/restaurant/');

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col relative">
        <Routes>
          <Route path="/" element={
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
              onViewDetails={(r) => navigate(`/restaurant/${r.id}`)}
              activeTab="visited"
            />
          } />
          <Route path="/togo" element={
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
              onViewDetails={(r) => navigate(`/restaurant/${r.id}`)}
              activeTab="wishlist"
            />
          } />
          <Route path="/map" element={
            <MapView
              restaurants={processedRestaurants}
              filters={filters}
              setFilters={setFilters}
              cuisines={uniqueCuisines}
              userLocation={userLocation}
              onViewDetails={(r) => navigate(`/restaurant/${r.id}`)}
            />
          } />
          <Route path="/stats" element={<StatsView pairId={profile.pair_id} />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="/restaurant/:id" element={
            <RestaurantDetailView
              currentUser={profile}
              onBack={() => navigate(-1)}
            />
          } />
          <Route path="/shared/:id" element={<SharedRestaurantView currentUser={profile} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {!isDetailsView && (
        <>
          <NavigationFAB />
          <RestaurantFAB onClick={() => setIsDrawerOpen(true)} />
        </>
      )}

      <AddRestaurantDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        profile={profile}
        onSuccess={refreshRestaurants}
        initialStatus={location.pathname === '/togo' ? 'wishlist' : 'visited'}
      />
    </div>
  );
}

export default App;
