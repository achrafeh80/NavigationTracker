import { Express, Request, Response } from "express";
import { WebSocketServer } from "ws";
import { IStorage } from "../storage";
import { Route, InsertRoute, insertRouteSchema } from "@shared/schema";
import axios from "axios";

// TomTom API key from environment variables
const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY || "";

export function setupNavigationRoutes(app: Express, storage: IStorage, wss: WebSocketServer) {
  // Get route between two points
  app.get("/api/navigation/route", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { originLat, originLon, destLat, destLon, avoidTolls, avoidHighways } = req.query;

      if (!originLat || !originLon || !destLat || !destLon) {
        return res.status(400).json({ message: "Origin and destination coordinates are required" });
      }

      // Build options for TomTom routing API
      const options = [];
      if (avoidTolls === 'true') options.push('avoid=tollRoads');
      if (avoidHighways === 'true') options.push('avoid=motorways');

      // Call TomTom API to get route
      const tomtomUrl = `https://api.tomtom.com/routing/1/calculateRoute/${originLat},${originLon}:${destLat},${destLon}/json?key=${TOMTOM_API_KEY}&instructionsType=text&language=fr-FR&traffic=true&${options.join('&')}`;
      
      const response = await axios.get(tomtomUrl);
      res.json(response.data);
    } catch (error) {
      console.error("Error fetching route:", error);
      res.status(500).json({ message: "Failed to fetch route" });
    }
  });

  // Save a route
  app.post("/api/navigation/routes", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const userId = req.user!.id;
      const routeData = req.body;

      // Validate route data
      const validatedData = insertRouteSchema.parse({
        ...routeData,
        userId
      });

      // Save route
      const savedRoute = await storage.saveRoute(validatedData);
      res.status(201).json(savedRoute);
    } catch (error) {
      console.error("Error saving route:", error);
      res.status(400).json({ message: "Invalid route data" });
    }
  });

  // Get recent routes for authenticated user
  app.get("/api/navigation/routes/recent", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 5;
      
      const routes = await storage.getRecentRoutes(userId, limit);
      res.json(routes);
    } catch (error) {
      console.error("Error fetching recent routes:", error);
      res.status(500).json({ message: "Failed to fetch recent routes" });
    }
  });

  // Get all routes for authenticated user
  app.get("/api/navigation/routes", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const userId = req.user!.id;
      const routes = await storage.getUserRoutes(userId);
      res.json(routes);
    } catch (error) {
      console.error("Error fetching user routes:", error);
      res.status(500).json({ message: "Failed to fetch routes" });
    }
  });

  // Add favorite location
  app.post("/api/navigation/favorites", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const userId = req.user!.id;
      const locationData = {
        ...req.body,
        userId
      };

      const savedLocation = await storage.addFavoriteLocation(locationData);
      res.status(201).json(savedLocation);
    } catch (error) {
      console.error("Error saving favorite location:", error);
      res.status(400).json({ message: "Invalid location data" });
    }
  });

  // Get favorite locations
  app.get("/api/navigation/favorites", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const userId = req.user!.id;
      const favoriteLocations = await storage.getFavoriteLocations(userId);
      res.json(favoriteLocations);
    } catch (error) {
      console.error("Error fetching favorite locations:", error);
      res.status(500).json({ message: "Failed to fetch favorite locations" });
    }
  });

  // Delete favorite location
  app.delete("/api/navigation/favorites/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const locationId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      const result = await storage.deleteFavoriteLocation(locationId, userId);
      if (result) {
        res.status(200).json({ success: true });
      } else {
        res.status(404).json({ message: "Favorite location not found" });
      }
    } catch (error) {
      console.error("Error deleting favorite location:", error);
      res.status(500).json({ message: "Failed to delete favorite location" });
    }
  });

  // Search address with TomTom API
  app.get("/api/navigation/search", async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      // Call TomTom API for geocoding
      const tomtomUrl = `https://api.tomtom.com/search/2/search/${encodeURIComponent(query as string)}.json?key=${TOMTOM_API_KEY}&language=fr-FR&countrySet=FR`;
      
      const response = await axios.get(tomtomUrl);
      res.json(response.data);
    } catch (error) {
      console.error("Error searching address:", error);
      res.status(500).json({ message: "Failed to search address" });
    }
  });

  // Reverse geocoding (coordinates to address)
  app.get("/api/navigation/reverse-geocode", async (req: Request, res: Response) => {
    try {
      const { lat, lon } = req.query;
      
      if (!lat || !lon) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }

      // Call TomTom API for reverse geocoding
      const tomtomUrl = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${TOMTOM_API_KEY}&language=fr-FR`;
      
      const response = await axios.get(tomtomUrl);
      res.json(response.data);
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      res.status(500).json({ message: "Failed to reverse geocode coordinates" });
    }
  });
}
