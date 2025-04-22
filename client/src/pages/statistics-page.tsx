import { useAuth } from '@/hooks/use-auth';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Loader2, TrendingUp, AlertCircle, Clock } from 'lucide-react';

export default function StatisticsPage() {
  useAuth();
  const { user } = useAuth();
  console.log("User:", user);

  
  // Define the type for incident statistics
  interface IncidentStats {
    byType: {
      accident: number;
      traffic: number;
      police: number;
      closed_road: number;
      construction: number;
      obstacle: number;
    };
    active: number;
    resolved: number;
    total: number;
    last24Hours: number;
    averageConfirmations: number;
    averageRefutations: number;
  }
  
  // Get incident statistics
  const { 
    data: incidentStats, 
    isLoading: loadingIncidentStats 
  } = useQuery<IncidentStats>({
    queryKey: ['/api/statistics/incidents'],
  });
  
  // Get user statistics
  interface UserStats {
    byType?: {
      accident: number;
      traffic: number;
      police: number;
      closed_road: number;
      construction: number;
      obstacle: number;
    };
    totalReported: number;
    totalRoutes: number;
  }

  const { 
    data: userStats, 
    isLoading: loadingUserStats 
  } = useQuery<UserStats>({
    queryKey: ['/api/statistics/user'],
  });
  
  // Get traffic prediction data
  interface PredictionData {
    hourly: { hour: number; congestionRisk: number }[];
    weekly: { day: string; congestionRisk: number }[];
  }

  const { 
    data: predictionData, 
    isLoading: loadingPrediction 
  } = useQuery<PredictionData>({
    queryKey: ['/api/statistics/prediction'],
  });
  

  
  // Prepare incident type data for pie chart
  const prepareIncidentTypeData = () => {
    if (!incidentStats?.byType) return [];
    
    return [
      { name: 'Accidents', value: incidentStats.byType.accident, color: '#F44336' },
      { name: 'Embouteillages', value: incidentStats.byType.traffic, color: '#FFC107' },
      { name: 'Contrôles', value: incidentStats.byType.police, color: '#2196F3' },
      { name: 'Routes fermées', value: incidentStats.byType.closed_road, color: '#F44336' },
      { name: 'Travaux', value: incidentStats.byType.construction, color: '#FF9800' },
      { name: 'Obstacles', value: incidentStats.byType.obstacle, color: '#FFC107' }
    ];
  };

  // Prepare status data for pie chart
  const prepareStatusData = () => {
    if (!incidentStats) return [];
    
    return [
      { name: 'Actifs', value: incidentStats.active, color: '#4CAF50' },
      { name: 'Résolus', value: incidentStats.resolved, color: '#9E9E9E' }
    ];
  };
  
  // Prepare user contribution data
  const prepareUserContributions = () => {
    if (!userStats?.byType) return [];
    
    return [
      { name: 'Accidents', count: userStats.byType.accident, color: '#F44336' },
      { name: 'Embouteillages', count: userStats.byType.traffic, color: '#FFC107' },
      { name: 'Contrôles', count: userStats.byType.police, color: '#2196F3' },
      { name: 'Routes fermées', count: userStats.byType.closed_road, color: '#F44336' },
      { name: 'Travaux', count: userStats.byType.construction, color: '#FF9800' },
      { name: 'Obstacles', count: userStats.byType.obstacle, color: '#FFC107' }
    ];
  };
  
  // Format number with leading zeros
  const formatHour = (hour: number) => {
    return `${hour}:00`;
  };

  return (
    <div className="flex h-screen w-full overflow-auto bg-neutral-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className={`p-6 pt-16'}`}>
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-heading font-bold text-neutral-900 mb-6">Statistiques</h1>
            
            <Tabs defaultValue="traffic" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="traffic">Trafic</TabsTrigger>
                <TabsTrigger value="incidents">Incidents</TabsTrigger>
                <TabsTrigger value="user">Mes contributions</TabsTrigger>
              </TabsList>
              
              {/* Traffic Tab */}
              <TabsContent value="traffic" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Embouteillages actuels</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {loadingIncidentStats ? <Loader2 className="h-4 w-4 animate-spin" /> : incidentStats?.byType.traffic || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        +{loadingIncidentStats ? '...' : incidentStats?.last24Hours || 0} en 24h
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Incidents actifs</CardTitle>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {loadingIncidentStats ? <Loader2 className="h-4 w-4 animate-spin" /> : incidentStats?.active || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Sur {loadingIncidentStats ? '...' : incidentStats?.total || 0} incidents signalés
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Temps moyen</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">+23 min</div>
                      <p className="text-xs text-muted-foreground">
                        Temps supplémentaire moyen dû au trafic
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Traffic Prediction */}
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Prévisions de trafic par heure</CardTitle>
                    <CardDescription>
                      Probabilité d'embouteillages selon l'heure de la journée
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingPrediction ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={predictionData?.hourly}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="hour" 
                            tickFormatter={formatHour}
                          />
                          <YAxis
                            label={{ 
                              value: 'Risque de congestion (%)', 
                              angle: -90, 
                              position: 'insideLeft' 
                            }}
                          />
                          <Tooltip 
                            formatter={(value) => [`${value}%`, 'Risque de congestion']}
                            labelFormatter={(label) => `${label}:00`}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="congestionRisk" 
                            name="Risque de congestion" 
                            stroke="#1976D2" 
                            activeDot={{ r: 8 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
                
                {/* Weekly Prediction */}
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Prévisions de trafic par jour</CardTitle>
                    <CardDescription>
                      Probabilité d'embouteillages selon le jour de la semaine
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingPrediction ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={predictionData?.weekly}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis 
                            label={{ 
                              value: 'Risque de congestion (%)', 
                              angle: -90, 
                              position: 'insideLeft' 
                            }}
                          />
                          <Tooltip formatter={(value) => [`${value}%`, 'Risque de congestion']} />
                          <Legend />
                          <Bar 
                            dataKey="congestionRisk" 
                            name="Risque de congestion" 
                            fill="#1976D2" 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Incidents Tab */}
              <TabsContent value="incidents" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Incidents by Type */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Types d'incidents signalés</CardTitle>
                      <CardDescription>
                        Répartition des incidents par catégorie
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      {loadingIncidentStats ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={prepareIncidentTypeData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {prepareIncidentTypeData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [value, 'Nombre d\'incidents']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Incidents Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Statut des incidents</CardTitle>
                      <CardDescription>
                        Incidents actifs vs résolus
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      {loadingIncidentStats ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={prepareStatusData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {prepareStatusData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [value, 'Nombre d\'incidents']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Incident Confirmations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Taux de confirmation</CardTitle>
                    <CardDescription>
                      Moyenne des confirmations et réfutations par incident
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingIncidentStats ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={[
                            { 
                              name: 'Confirmations', 
                              value: incidentStats?.averageConfirmations || 0,
                              color: '#4CAF50'
                            },
                            { 
                              name: 'Réfutations', 
                              value: incidentStats?.averageRefutations || 0,
                              color: '#F44336'
                            }
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis
                            label={{ 
                              value: 'Moyenne par incident', 
                              angle: -90, 
                              position: 'insideLeft' 
                            }}
                          />
                          <Tooltip />
                          <Bar dataKey="value" name="Moyenne">
                            {[
                              { name: 'Confirmations', value: 0, color: '#4CAF50' },
                              { name: 'Réfutations', value: 0, color: '#F44336' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* User Tab */}
              <TabsContent value="user" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Incidents signalés</CardTitle>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {loadingUserStats ? <Loader2 className="h-4 w-4 animate-spin" /> : userStats?.totalReported || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Incidents que vous avez signalés
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Itinéraires calculés</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {loadingUserStats ? <Loader2 className="h-4 w-4 animate-spin" /> : userStats?.totalRoutes || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Itinéraires que vous avez utilisés
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Score de contribution</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {loadingUserStats ? <Loader2 className="h-4 w-4 animate-spin" /> : (userStats?.totalReported ?? 0) * 10}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Points basés sur vos contributions
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* User Contributions by Type */}
                <Card>
                  <CardHeader>
                    <CardTitle>Mes signalements par type</CardTitle>
                    <CardDescription>
                      Types d'incidents que vous avez signalés
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingUserStats ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={prepareUserContributions()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis
                            label={{ 
                              value: 'Nombre de signalements', 
                              angle: -90, 
                              position: 'insideLeft' 
                            }}
                          />
                          <Tooltip />
                          <Bar dataKey="count" name="Signalements">
                            {prepareUserContributions().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
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
