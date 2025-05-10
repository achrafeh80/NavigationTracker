import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertIncidentSchema, insertVerificationSchema, insertRouteSchema } from "@shared/schema";
import { randomBytes } from "crypto";
import { WebSocketServer, WebSocket } from "ws";

// WebSocket clients
const clients: Map<number, WebSocket> = new Map();

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  const httpServer = createServer(app);

  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // WebSocket connection handling
  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle client identification
        if (data.type === 'identify' && data.userId) {
          clients.set(data.userId, ws);
          console.log(`User ${data.userId} connected to WebSocket`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      // Remove client from map when disconnected
      for (const [userId, client] of Array.from(clients.entries())) {
        if (client === ws) {
          clients.delete(userId);
          console.log(`User ${userId} disconnected from WebSocket`);
          break;
        }
      }
    });
  });

  // Broadcast incident to all connected clients
  function broadcastIncident(incident: any) {
    const message = JSON.stringify({
      type: 'incident',
      data: incident
    });

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

// Users admin
app.get('/api/users', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const allUsers = await storage.getAllUsers();
    // Ne pas retourner les mots de passe
    const safeUsers = allUsers.map(u => ({ ...u, password: undefined }));
    res.status(200).json(safeUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const userId = Number(req.params.id);
    const data = req.body; // { username?, email?, name? }
    await storage.updateUser(userId, data);
    res.status(200).json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const userId = Number(req.params.id);
    await storage.deleteUser(userId);
    res.status(200).json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

  // Incidents admin
  app.get('/api/admin/incidents', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
    try {
      const allIncidents = await storage.getAllIncidents();  // à implémenter, retourne incidents actifs + inactifs
      res.status(200).json(allIncidents);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put('/api/incidents/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
    try {
      const incidentId = Number(req.params.id);
      const data = req.body; // { active?: boolean, type?: string, comment?: string }
      await storage.updateIncident(incidentId, data);
      res.status(200).json({ message: 'Incident updated' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete('/api/incidents/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
    try {
      const incidentId = Number(req.params.id);
      await storage.deleteIncident(incidentId);
      res.status(200).json({ message: 'Incident deleted' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // Routes admin
  app.get('/api/admin/routes', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
    try {
      const allRoutes = await storage.getAllRoutes();
      res.status(200).json(allRoutes);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });


  // Incidents API
  app.post('/api/incidents', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });

    try {
      const userId = req.user!.id;
      const incidentData = insertIncidentSchema.parse({
        ...req.body,
        reportedBy: userId
      });

      const newIncident = await storage.createIncident(incidentData);
      
      // Broadcast the new incident to all connected clients
      broadcastIncident(newIncident);
      
      res.status(201).json(newIncident);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/incidents', async (req: Request, res: Response) => {
    try {
      const incidents = await storage.getActiveIncidents();
      res.status(200).json(incidents);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/incidents/:id/verify', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });

    try {
      const incidentId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if user already verified this incident
      const existingVerification = await storage.getUserVerification(incidentId, userId);
      if (existingVerification) {
        return res.status(400).json({ message: 'You have already verified this incident' });
      }

      const verificationData = insertVerificationSchema.parse({
        incidentId,
        userId,
        isConfirmed: req.body.isConfirmed
      });

      const verification = await storage.createVerification(verificationData);
      
      // Get updated incident to broadcast
      const updatedIncident = await storage.getIncidentById(incidentId);
      if (updatedIncident) {
        broadcastIncident(updatedIncident);
      }
      
      res.status(201).json(verification);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Routes API
  app.post('/api/routes', async (req: Request, res: Response) => {
      const { origin, destination, routeData } = req.body;

    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });

    try {
      const userId = req.user!.id;
      
      // Generate a random share code
      const shareCode = randomBytes(6).toString('hex');
      
      const routeData = insertRouteSchema.parse({
        ...req.body,
        userId,
        shareCode
      });

      const newRoute = await storage.createRoute(routeData);
      res.status(201).json(newRoute);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/routes', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });

    try {
      const userId = req.user!.id;
      const routes = await storage.getRoutesByUserId(userId);
      res.status(200).json(routes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/routes/share/:code', async (req: Request, res: Response) => {
    try {
      const shareCode = req.params.code;
      const route = await storage.getRouteByShareCode(shareCode);
      
      if (!route) {
        return res.status(404).json({ message: 'Route not found' });
      }
      
      res.status(200).json(route);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
