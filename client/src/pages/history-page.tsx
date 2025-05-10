import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import { formatDistance, formatDuration } from "@/lib/tomtom";
import { useEffect, useState } from "react";

interface RouteEntry {
  id: number;
  origin: string;
  destination: string;
  routeData: any;
  createdAt: string;
}

export default function HistoryPage() {
  const { data: routes = [], isLoading } = useQuery<RouteEntry[]>({
    queryKey: ['/api/routes']
  });

  const [cityNames, setCityNames] = useState<Record<number, { from: string; to: string }>>({});

  useEffect(() => {
    const fetchCityName = async (coords: string): Promise<string> => {
      const [lat, lon] = coords.split(",").map(Number);
      if (!lat || !lon) return "Coordonnées invalides";
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          {
            headers: {
              'Accept-Language': 'fr',
            }
          }
        );
        const data = await res.json();
        const city = data.address?.city || data.address?.town || data.address?.village;
        const country = data.address?.country;
        return city && country ? `${city}, ${country}` : `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      } catch (err) {
        console.error("Error fetching city name:", err);
        return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      }
    };

    const loadAllCities = async () => {
      const allCities: Record<number, { from: string; to: string }> = {};
      for (const route of routes) {
        if (!cityNames[route.id]) {
          const from = await fetchCityName(route.origin);
          const to = await fetchCityName(route.destination);
          allCities[route.id] = { from, to };
        }
      }
      setCityNames(prev => ({ ...prev, ...allCities }));
    };

    if (routes.length > 0) {
      loadAllCities();
    }
  }, [routes]);

  let content;
  if (isLoading) {
    content = <p>Chargement de vos trajets...</p>;
  } else if (routes.length === 0) {
    content = <p>Aucun trajet effectué pour l'instant.</p>;
  } else {
    content = (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3 border-b">Départ</th>
              <th className="p-3 border-b">Arrivée</th>
              <th className="p-3 border-b">Distance</th>
              <th className="p-3 border-b">Durée</th>
              <th className="p-3 border-b">Date</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => {
              const distance = formatDistance(route.routeData.summary.lengthInMeters);
              const duration = formatDuration(route.routeData.summary.travelTimeInSeconds);
              const dateStr = new Date(route.createdAt).toLocaleString();

              const cities = cityNames[route.id] || { from: "Chargement...", to: "Chargement..." };

              return (
                <tr key={route.id} className="hover:bg-gray-50">
                  <td className="p-3 border-b">{cities.from}</td>
                  <td className="p-3 border-b">{cities.to}</td>
                  <td className="p-3 border-b">{distance}</td>
                  <td className="p-3 border-b">{duration}</td>
                  <td className="p-3 border-b">{dateStr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-grow p-6">
        <h1 className="text-2xl font-bold mb-6">Historique de vos trajets</h1>
        {content}
      </main>
    </div>
  );
}
