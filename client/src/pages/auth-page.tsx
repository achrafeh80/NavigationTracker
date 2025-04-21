import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import AuthPanel from "@/components/auth-panel";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-neutral-100 relative overflow-hidden">
      {/* Background with map-like graphics */}
      <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ 
        backgroundImage: `url('https://api.tomtom.com/map/1/static/22.275,60.45/10/800x600.png?key=G3WCiiFF89kmTHGsU4wFI4hTpNXScR7G')` 
      }} />
      
      {/* Overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
      
      {/* App Logo */}
      <div className="absolute top-8 left-8 flex items-center z-10">
        <span className="material-icons text-primary text-3xl">navigation</span>
        <h1 className="text-2xl font-bold text-primary ml-2">SupMap</h1>
      </div>
      
      {/* Auth Panel */}
      <div className="relative z-10 w-full max-w-screen-xl mx-auto flex flex-col md:flex-row">
        {/* Left side - Auth form */}
        <div className="w-full md:w-1/2 p-6">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto">
            <AuthPanel />
          </div>
        </div>
        
        {/* Right side - Features showcase */}
        <div className="w-full md:w-1/2 p-6 flex items-center">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-6">Real-time Navigation with Community Power</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <span className="material-icons">map</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Real-time Traffic Updates</h3>
                  <p className="text-white text-opacity-80">Get live traffic data and avoid congestion</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <span className="material-icons">warning</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Community Incident Reports</h3>
                  <p className="text-white text-opacity-80">Be warned about accidents and hazards ahead</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <span className="material-icons">alt_route</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Smart Route Calculation</h3>
                  <p className="text-white text-opacity-80">Multiple route options based on your preferences</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <span className="material-icons">share</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Easy Route Sharing</h3>
                  <p className="text-white text-opacity-80">Share routes via QR code or direct links</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
