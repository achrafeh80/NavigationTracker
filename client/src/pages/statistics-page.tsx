import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, AlertCircle, TrendingUp, Clock } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { apiRequest } from "@/lib/queryClient";

export default function StatisticsPage() {
  const [incidentStats, setIncidentStats] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [predictionData, setPredictionData] = useState<any>(null);
  const [loadingIncidentStats, setLoadingIncidentStats] = useState(true);
  const [loadingUserStats, setLoadingUserStats] = useState(true);
  const [loadingPrediction, setLoadingPrediction] = useState(true);

  useEffect(() => {
    apiRequest("/api/statistics/incidents")
      .then((res) => setIncidentStats(res))
      .finally(() => setLoadingIncidentStats(false));

    apiRequest("/api/statistics/user")
      .then((res) => setUserStats(res))
      .finally(() => setLoadingUserStats(false));

    apiRequest("/api/statistics/prediction")
      .then((res) => setPredictionData(res))
      .finally(() => setLoadingPrediction(false));
  }, []);

  const prepareIncidentTypeData = () => {
    if (!incidentStats?.byType) return [];
    return [
      { name: "Accidents", value: incidentStats.byType.accident, color: "#F44336" },
      { name: "Embouteillages", value: incidentStats.byType.traffic, color: "#FFC107" },
      { name: "Contrôles", value: incidentStats.byType.police, color: "#2196F3" },
      { name: "Routes fermées", value: incidentStats.byType.closed_road, color: "#F44336" },
      { name: "Travaux", value: incidentStats.byType.construction, color: "#FF9800" },
      { name: "Obstacles", value: incidentStats.byType.obstacle, color: "#FFC107" },
    ];
  };

  const prepareStatusData = () => {
    if (!incidentStats) return [];
    return [
      { name: "Actifs", value: incidentStats.active, color: "#4CAF50" },
      { name: "Résolus", value: incidentStats.resolved, color: "#9E9E9E" },
    ];
  };

  const prepareUserContributions = () => {
    if (!userStats?.byType) return [];
    return [
      { name: "Accidents", count: userStats.byType.accident, color: "#F44336" },
      { name: "Embouteillages", count: userStats.byType.traffic, color: "#FFC107" },
      { name: "Contrôles", count: userStats.byType.police, color: "#2196F3" },
      { name: "Routes fermées", count: userStats.byType.closed_road, color: "#F44336" },
      { name: "Travaux", count: userStats.byType.construction, color: "#FF9800" },
      { name: "Obstacles", count: userStats.byType.obstacle, color: "#FFC107" },
    ];
  };

  const formatHour = (hour: number) => `${hour}:00`;

  return (
    <div className="flex h-screen w-full overflow-auto bg-neutral-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 pt-16">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Statistiques</h1>

            <Tabs defaultValue="traffic">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="traffic">Trafic</TabsTrigger>
                <TabsTrigger value="incidents">Incidents</TabsTrigger>
                <TabsTrigger value="user">Mes contributions</TabsTrigger>
              </TabsList>

              {/* Tab 1: Trafic */}
              <TabsContent value="traffic">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Embouteillages actuels</CardTitle>
                      <CardDescription>+{incidentStats?.last24Hours || 0} en 24h</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {loadingIncidentStats ? <Loader2 className="animate-spin" /> : incidentStats?.byType.traffic || 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Incidents actifs</CardTitle>
                      <CardDescription>Sur {incidentStats?.total || 0}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {loadingIncidentStats ? <Loader2 className="animate-spin" /> : incidentStats?.active || 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Temps moyen</CardTitle>
                      <CardDescription>Temps estimé en plus</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">+23 min</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Graphiques */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Prédiction horaire</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={predictionData?.hourly || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" tickFormatter={formatHour} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="congestionRisk" stroke="#1976D2" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Prédiction hebdomadaire</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={predictionData?.weekly || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="congestionRisk" fill="#1976D2" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: Incidents */}
              <TabsContent value="incidents">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Types d'incidents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={prepareIncidentTypeData()}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            dataKey="value"
                          >
                            {prepareIncidentTypeData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Actifs vs Résolus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={prepareStatusData()}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            dataKey="value"
                          >
                            {prepareStatusData().map((entry, index) => (
                              <Cell key={`cell-status-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Confirmations & Réfutations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          { name: "Confirmations", value: incidentStats?.averageConfirmations || 0, color: "#4CAF50" },
                          { name: "Réfutations", value: incidentStats?.averageRefutations || 0, color: "#F44336" },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value">
                          <Cell fill="#4CAF50" />
                          <Cell fill="#F44336" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: Utilisateur */}
              <TabsContent value="user">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Incidents signalés</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {loadingUserStats ? <Loader2 className="animate-spin" /> : userStats?.totalReported || 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Itinéraires enregistrés</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {loadingUserStats ? <Loader2 className="animate-spin" /> : userStats?.totalRoutes || 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Score de contribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {(userStats?.totalReported || 0) * 10}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Mes signalements par type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={prepareUserContributions()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count">
                          {prepareUserContributions().map((entry, index) => (
                            <Cell key={`user-cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
