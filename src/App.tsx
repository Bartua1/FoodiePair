import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { UserSync } from './components/auth/UserSync';
import { PairingFlow } from './components/pairing/PairingFlow';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { Profile } from './types';
import { Utensils } from 'lucide-react';
import { RestaurantFAB } from './components/restaurant/RestaurantFAB';
import { AddRestaurantDrawer } from './components/restaurant/AddRestaurantDrawer';
import { useTranslation } from 'react-i18next';
import { useGeolocation } from './hooks/useGeolocation';
import { useAppStore } from './store/useAppStore';

// New components
import { TabNavigation } from './components/layout/TabNavigation';
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
  const { i18n } = useTranslation();

  // Store
  const profile = useAppStore(state => state.profile);
  const setProfile = useAppStore(state => state.setProfile);
  const view = useAppStore(state => state.view);
  const isDrawerOpen = useAppStore(state => state.isDrawerOpen);
  const setIsDrawerOpen = useAppStore(state => state.setIsDrawerOpen);
  const selectedRestaurant = useAppStore(state => state.selectedRestaurant);
  const setSelectedRestaurant = useAppStore(state => state.setSelectedRestaurant);
  const fetchRestaurants = useAppStore(state => state.fetchRestaurants);
  const setUserLocation = useAppStore(state => state.setUserLocation);

  // Geolocation
  const { location: userLocation, error: geoError, retry: retryGeo } = useGeolocation();

  // Sync user location to store
  useEffect(() => {
    setUserLocation(userLocation);
  }, [userLocation, setUserLocation]);

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
          // Fetch restaurants once profile is loaded
          fetchRestaurants(profileData);
        }
      }
    }
    getInitialProfile();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, i18n, setProfile, fetchRestaurants]);

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
            geoError={geoError}
            retryGeo={retryGeo}
            onRefresh={() => fetchRestaurants(profile)}
          />
        );
      case 'map':
        return (
          <MapView />
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

      <TabNavigation />

      <RestaurantFAB />

      <AddRestaurantDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        profile={profile}
        onSuccess={() => fetchRestaurants(profile)}
      />
    </div>
  );
}

export default App;
