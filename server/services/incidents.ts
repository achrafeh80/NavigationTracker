import { Express, Request, Response } from "express";
import { WebSocketServer, WebSocket } from "ws";
import { IStorage } from "../storage";
import { 
  Incident, 
  insertIncidentSchema, 
  insertIncidentReactionSchema
} from "@shared/schema";
import { z } from "zod";

export function setupIncidentRoutes(app: Express, storage: IStorage, wss: WebSocketServer) {
  // Report a new incident
  app.post("/api/incidents", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const userId = req.user!.id;
      
      // Validate incident data
      const validatedData = insertIncidentSchema.parse({
        ...req.body,
        reportedBy: userId
      });

      // Create incident
      const incident = await storage.createIncident(validatedData);
      
      // Broadcast to all connected clients
      broadcastToAll(wss, {
        type: "new_incident",
        incident
      });

      res.status(201).json(incident);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid incident data", errors: error.errors });
      } else {
        console.error("Error creating incident:", error);
        res.status(500).json({ message: "Failed to create incident" });
      }
    }
  });

  // Get all active incidents
  app.get("/api/incidents", async (req: Request, res: Response) => {
    try {
      const incidents = await storage.getIncidents(true);
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      res.status(500).json({ message: "Failed to fetch incidents" });
    }
  });

  // Get incidents near a location
  app.get("/api/incidents/nearby", async (req: Request, res: Response) => {
    try {
      const { lat, lon, radius } = req.query;
      
      if (!lat || !lon) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }

      const radiusKm = parseFloat(radius as string) || 5; // Default 5km
      
      const incidents = await storage.getIncidentsNearby(
        lat as string, 
        lon as string, 
        radiusKm
      );
      
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching nearby incidents:", error);
      res.status(500).json({ message: "Failed to fetch nearby incidents" });
    }
  });

  // React to an incident (confirm or deny)
  app.post("/api/incidents/:id/react", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const incidentId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { isConfirmation } = req.body;
      
      // Check if incident exists
      const incident = await storage.getIncidentById(incidentId);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      
      // Check if user already reacted to this incident
      const existingReaction = await storage.getIncidentReaction(incidentId, userId);
      if (existingReaction) {
        return res.status(400).json({ message: "User already reacted to this incident" });
      }
      
      // Create reaction
      const reactionData = {
        incidentId,
        userId,
        isConfirmation
      };
      
      const validatedData = insertIncidentReactionSchema.parse(reactionData);
      const reaction = await storage.addIncidentReaction(validatedData);
      
      // Get updated incident
      const updatedIncident = await storage.getIncidentById(incidentId);
      
      // Broadcast to all connected clients
      broadcastToAll(wss, {
        type: "incident_update",
        incident: updatedIncident
      });

      res.status(201).json(reaction);
    } catch (error) {
      console.error("Error reacting to incident:", error);
      res.status(500).json({ message: "Failed to react to incident" });
    }
  });

  // Deactivate incident (e.g., resolved)
  app.put("/api/incidents/:id/status", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const incidentId = parseInt(req.params.id);
      const { active } = req.body;
      
      if (typeof active !== 'boolean') {
        return res.status(400).json({ message: "Active status must be a boolean" });
      }
      
      const updatedIncident = await storage.updateIncidentStatus(incidentId, active);
      
      if (!updatedIncident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      
      // Broadcast to all connected clients
      broadcastToAll(wss, {
        type: "incident_status_change",
        incident: updatedIncident
      });

      res.json(updatedIncident);
    } catch (error) {
      console.error("Error updating incident status:", error);
      res.status(500).json({ message: "Failed to update incident status" });
    }
  });
}

// Broadcast a message to all connected clients
function broadcastToAll(wss: WebSocketServer, data: any) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}
