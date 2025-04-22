import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import AuthPanel from "@/components/auth-panel";
import { motion } from "framer-motion"; 

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-900 relative overflow-hidden">
      {/* Abstract map pattern background */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="map-grid" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 0,50 L 100,50 M 50,0 L 50,100" stroke="white" strokeWidth="0.5" fill="none" />
          </pattern>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#map-grid)" />
          <circle cx="30%" cy="20%" r="50" fill="white" fillOpacity="0.1" />
          <circle cx="70%" cy="60%" r="80" fill="white" fillOpacity="0.1" />
          <path d="M 10,30 Q 50,10 90,40 T 200,60" stroke="white" strokeWidth="2" fill="none" strokeOpacity="0.1" />
          <path d="M 30,70 Q 80,40 150,80 T 280,50" stroke="white" strokeWidth="2" fill="none" strokeOpacity="0.1" />
        </svg>
      </div>
      
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-secondary/40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(0,0,0,0.4)_100%)]" />
      
      {/* Animated dots */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div 
            key={crypto.randomUUID()}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 4 + 1 + 'px',
              height: Math.random() * 4 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.3,
              animation: `float ${Math.random() * 10 + 10}s infinite linear`
            }}
          />
        ))}
      </div>
      
      {/* App Logo with */}
      <motion.div 
        className="absolute top-8 left-8 flex items-center z-10"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center">
          {/* Logo icon in a glowing circular background */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-md"></div>
            <div className="relative p-3 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
              <span className="material-icons text-white text-2xl">navigation</span>
            </div>
          </div>
          
          {/* Logo text with gradient */}
          <div className="ml-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent tracking-tight">
              SupMap
            </h1>
            <p className="text-xs text-white/70 mt-0.5">Navigate together</p>
          </div>
        </div>
      </motion.div>
      
      {/* Auth Panel & Features Container */}
      <div className="relative z-10 w-full max-w-screen-xl mx-auto flex flex-col md:flex-row items-center px-6">
        {/* Left side - Auth form with glass effect */}
        <motion.div 
          className="w-full md:w-1/2 p-6 mt-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-md mx-auto border border-white/10">
            <AuthPanel />
          </div>
        </motion.div>
        
        {/* Right side - Features showcase with animations */}
        <motion.div 
          className="w-full md:w-1/2 p-6 flex items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="text-white">
            <motion.h2 
              className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent"
              variants={itemVariants}
            >
              Real-time Navigation with Community Power
            </motion.h2>
            
            <div className="space-y-6">
              <motion.div variants={itemVariants} className="feature-card">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-primary/80 to-primary/40 p-3 rounded-xl shadow-lg border border-primary/20">
                    <span className="material-icons text-white text-2xl">map</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl">Real-time Traffic Updates</h3>
                    <p className="text-white/80 mt-1">Get live traffic data and avoid congestion</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="feature-card">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-primary/80 to-primary/40 p-3 rounded-xl shadow-lg border border-primary/20">
                    <span className="material-icons text-white text-2xl">warning</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl">Community Incident Reports</h3>
                    <p className="text-white/80 mt-1">Be warned about accidents and hazards ahead</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="feature-card">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-primary/80 to-primary/40 p-3 rounded-xl shadow-lg border border-primary/20">
                    <span className="material-icons text-white text-2xl">alt_route</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl">Smart Route Calculation</h3>
                    <p className="text-white/80 mt-1">Multiple route options based on your preferences</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="feature-card">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-primary/80 to-primary/40 p-3 rounded-xl shadow-lg border border-primary/20">
                    <span className="material-icons text-white text-2xl">share</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl">Easy Route Sharing</h3>
                    <p className="text-white/80 mt-1">Share routes via QR code or direct links</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Add global styles for animations */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        
        .feature-card {
          transition: all 0.3s ease;
        }
        
        .feature-card:hover {
          transform: translateY(-5px);
        }
      `}</style>
    </div>
  );
}