import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { SunIcon, MoonIcon } from "lucide-react";

export default function SettingsPage() {
  // État local du thème : true = sombre, false = clair
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // Valeur initiale depuis localStorage ou préférence système
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
    }
    return false;
  });

  // Effet d'application du thème
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Sidebar />
      <main className="flex-grow p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
            Paramètres
          </h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-700 dark:text-gray-200">
              Préférences d'affichage
            </h2>
            
            <div className="flex flex-col space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-200 font-medium">Thème</span>
                
                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                  <button 
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                      !darkMode 
                        ? "bg-white dark:bg-gray-600 text-blue-600 shadow-sm" 
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                    onClick={() => setDarkMode(false)} 
                    aria-label="Mode clair"
                  >
                    <SunIcon size={18} />
                    <span>Clair</span>
                  </button>
                  
                  <button 
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                      darkMode 
                        ? "bg-white dark:bg-gray-600 text-blue-600 shadow-sm" 
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                    onClick={() => setDarkMode(true)} 
                    aria-label="Mode sombre"
                  >
                    <MoonIcon size={18} />
                    <span>Sombre</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}