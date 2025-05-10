import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Define the User type
type User = {
  id: number;
  username: string;
  email: string;
};

// Define the Incident type
type Incident = {
  id: number;
  type: string;
  latitude: number;
  longitude: number;
  comment?: string;
  confirmed: number;
  refuted: number;
  active: boolean;
};

// Define the Route type
type Route = {
  id: number;
  userId: number;
  origin: string;
  destination: string;
  routeData: {
    summary: {
      lengthInMeters: number;
      travelTimeInSeconds: number;
    };
  };
  createdAt: string;
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'incidents' | 'routes'>('users');
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Fetch data
  const { data: users = [] } = useQuery<User[]>({ queryKey: ['/api/users'] });
  const { data: incidents = [] } = useQuery<Incident[]>({ queryKey: ['/api/admin/incidents'] });
  const { data: routes = [] } = useQuery<Route[]>({ queryKey: ['/api/admin/routes'] });

  // Mutations
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => apiRequest('DELETE', `/api/users/${userId}`),
    onSuccess: () => {/* reload users */}
  });
  
  const createOrUpdateUserMutation = useMutation({
    mutationFn: (userData: Partial<User>) => {
      if (userData.id) {
        return apiRequest('PUT', `/api/users/${userData.id}`, userData);
      }
      return apiRequest('POST', '/api/users', userData);
    },
    onSuccess: () => {
      setShowUserModal(false);
      setEditingUser(null);
      // Here you would typically invalidate and refresh the user data
    }
  });
  
  const deleteIncidentMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/incidents/${id}`),
    onSuccess: () => {/* reload incidents */}
  });
  
  const closeIncidentMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('PUT', `/api/incidents/${id}`, { active: false }),
    onSuccess: () => {/* reload incidents */}
  });

  // User form state
  const [userForm, setUserForm] = useState<{username: string, email: string}>({
    username: '',
    email: ''
  });

  // Event handlers
  const handleDeleteUser = (id: number) => { 
    if(confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      deleteUserMutation.mutate(id);
    }
  };
  
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email
    });
    setShowUserModal(true);
  };
  

  
  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData = editingUser 
      ? { ...userForm, id: editingUser.id }
      : userForm;
    
    createOrUpdateUserMutation.mutate(userData as Partial<User>);
  };
  
  const handleDeleteIncident = (id: number) => { 
    if(confirm("Supprimer cet incident ?")) deleteIncidentMutation.mutate(id) 
  };
  
  const handleCloseIncident = (id: number) => { 
    closeIncidentMutation.mutate(id) 
  };

  // Helper functions
  function formatDistance(lengthInMeters: number): React.ReactNode {
    if (lengthInMeters >= 1000) {
      return `${(lengthInMeters / 1000).toFixed(1)} km`;
    }
    return `${lengthInMeters} m`;
  }

  function formatDuration(travelTimeInSeconds: number): React.ReactNode {
    const hours = Math.floor(travelTimeInSeconds / 3600);
    const minutes = Math.floor((travelTimeInSeconds % 3600) / 60);
    const seconds = travelTimeInSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }
  
  function formatDate(dateStr: string): React.ReactNode {
    const date = new Date(dateStr);
    
    // Format date: 10 mai 2025 à 14:30
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('fr-FR', options).replace(' à', ',');
  }
  
  // Helper to get username by ID
  function getUsernameById(userId: number): string {
    const user = users.find(u => u.id === userId);
    return user ? user.username : `Utilisateur #${userId}`;
  }
  
  // Helper to parse location
  function parseLocation(location: string): {city: string, country: string} {
    // Simple parsing assuming format "City, Country" or just "City"
    const parts = location.split(',').map(part => part.trim());
    return {
      city: parts[0] || '',
      country: parts.length > 1 ? parts[1] : ''
    };
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-grow p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Panel d'Administration</h1>
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-200 mb-8">
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 mr-2
                ${activeTab === 'users' 
                  ? 'bg-white text-blue-600 border-l border-t border-r border-gray-200' 
                  : 'text-gray-600 hover:text-blue-500'}`}
            >
              Utilisateurs
            </button>
            <button 
              onClick={() => setActiveTab('incidents')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 mr-2
                ${activeTab === 'incidents' 
                  ? 'bg-white text-blue-600 border-l border-t border-r border-gray-200' 
                  : 'text-gray-600 hover:text-blue-500'}`}
            >
              Incendies
            </button>
            <button 
              onClick={() => setActiveTab('routes')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200
                ${activeTab === 'routes' 
                  ? 'bg-white text-blue-600 border-l border-t border-r border-gray-200' 
                  : 'text-gray-600 hover:text-blue-500'}`}
            >
              Trajets
            </button>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-lg shadow p-6">
            {activeTab === 'users' && (
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Utilisateurs</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom d'utilisateur</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex">
                            <button 
                              onClick={() => handleEditUser(user)}
                              className="inline-flex items-center text-blue-600 hover:text-blue-800 mr-3 transition-colors duration-200"
                            >
                              <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                              </svg>
                              Modifier
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.id)} 
                              className="inline-flex items-center text-red-600 hover:text-red-800 transition-colors duration-200"
                            >
                              <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Modal pour ajouter/modifier un utilisateur */}
                {showUserModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                      <h3 className="text-lg font-semibold mb-4">
                        {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
                      </h3>
                      
                      <form onSubmit={handleUserFormSubmit}>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom d'utilisateur
                          </label>
                          <input
                            type="text"
                            value={userForm.username}
                            onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={userForm.email}
                            onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowUserModal(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600"
                          >
                            {editingUser ? 'Enregistrer' : 'Ajouter'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'incidents' && (
            <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Incidents signalés</h2>

                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commentaire</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {incidents.map((incident) => (
                        <tr key={incident.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{incident.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{incident.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{incident.comment || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm flex">
                            {incident.active && (
                            <button 
                                onClick={() => handleCloseIncident(incident.id)} 
                                className="text-orange-600 hover:text-orange-800 mr-3 transition-colors duration-200">
                                Clôturer
                            </button>
                            )}
                            <button 
                            onClick={() => handleDeleteIncident(incident.id)} 
                            className="text-red-600 hover:text-red-800 transition-colors duration-200">
                            Supprimer
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </section>
            )}


            {activeTab === 'routes' && (
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Historique des Trajets</h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origine</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durée</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {routes.map(route => {
                        const origin = parseLocation(route.origin);
                        const destination = parseLocation(route.destination);
                        
                        return (
                          <tr key={route.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{route.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {getUsernameById(route.userId)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="font-medium text-gray-900">{origin.city}</div>
                              {origin.country && <div className="text-gray-500 text-xs">{origin.country}</div>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="font-medium text-gray-900">{destination.city}</div>
                              {destination.country && <div className="text-gray-500 text-xs">{destination.country}</div>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDistance(route.routeData.summary.lengthInMeters)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDuration(route.routeData.summary.travelTimeInSeconds)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(route.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}