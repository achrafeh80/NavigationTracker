import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { MapProvider } from "@/context/map-context";
import { NavigationProvider } from "@/context/navigation-context";
import { IncidentsProvider } from "@/context/incidents-context";
import StatisticsPage from "@/pages/statistics-page"; 
import settingsPage from "@/pages/settings-page";
import HistoryPage from "@/pages/history-page";
import AdminPage from "./pages/admin-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/settings" component={settingsPage} />
      <ProtectedRoute path="/history" component={HistoryPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <Route path="/statistics" component={StatisticsPage} /> 
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MapProvider>
          <NavigationProvider>
            <IncidentsProvider>
              <Router />
              <Toaster />
            </IncidentsProvider>
          </NavigationProvider>
        </MapProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
