import { Express, Request, Response } from "express";
import { IStorage } from "../storage";

export function setupStatisticsRoutes(app: Express, storage: IStorage) {
  // Get statistics on incidents by type
  app.get("/api/statistics/incidents", async (req: Request, res: Response) => {
    try {
      // Get all incidents
      const incidents = await storage.getIncidents();
      
      // Count incidents by type
      const incidentTypes = {
        accident: 0,
        traffic: 0,
        police: 0,
        closed_road: 0,
        construction: 0,
        obstacle: 0
      };
      
      incidents.forEach(incident => {
        if (incident.type in incidentTypes) {
          incidentTypes[incident.type as keyof typeof incidentTypes]++;
        }
      });
      
      // Calculate active vs. resolved incidents
      const activeIncidents = incidents.filter(incident => incident.active).length;
      const resolvedIncidents = incidents.length - activeIncidents;
      
      // Calculate confirmation rates
      const averageConfirmations = incidents.reduce((sum, incident) => sum + incident.confirmed, 0) / incidents.length || 0;
      const averageRefutations = incidents.reduce((sum, incident) => sum + incident.refuted, 0) / incidents.length || 0;
      
      // Get last 24 hours incidents
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);
      const recentIncidents = incidents.filter(incident => incident.createdAt > last24Hours);
      
      res.json({
        total: incidents.length,
        byType: incidentTypes,
        active: activeIncidents,
        resolved: resolvedIncidents,
        averageConfirmations,
        averageRefutations,
        last24Hours: recentIncidents.length
      });
    } catch (error) {
      console.error("Error fetching incident statistics:", error);
      res.status(500).json({ message: "Failed to fetch incident statistics" });
    }
  });

  // Get user contribution statistics
  app.get("/api/statistics/user", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const userId = req.user!.id;
      
      // Get all incidents
      const incidents = await storage.getIncidents();
      
      // Get incidents reported by user
      const userReportedIncidents = incidents.filter(incident => incident.reportedBy === userId);
      
      // Calculate by type
      const incidentTypes = {
        accident: 0,
        traffic: 0,
        police: 0,
        closed_road: 0,
        construction: 0,
        obstacle: 0
      };
      
      userReportedIncidents.forEach(incident => {
        if (incident.type in incidentTypes) {
          incidentTypes[incident.type as keyof typeof incidentTypes]++;
        }
      });
      
      // Get routes count
      const userRoutes = await storage.getUserRoutes(userId);
      
      res.json({
        totalReported: userReportedIncidents.length,
        byType: incidentTypes,
        totalRoutes: userRoutes.length
      });
    } catch (error) {
      console.error("Error fetching user statistics:", error);
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });

  // Get traffic prediction data
  app.get("/api/statistics/prediction", async (req: Request, res: Response) => {
    try {
      // In a real implementation, this would use historical data and machine learning models
      // For demo purposes, we'll return some simulated data
      
      // Get hours of the day
      const hours = Array.from({ length: 24 }, (_, i) => i);
      
      // Create mock data for traffic prediction
      const trafficPrediction = hours.map(hour => {
        // Higher values during rush hours (8-9 AM and 5-7 PM)
        let predictionValue = 0;
        
        if (hour >= 8 && hour <= 9) {
          predictionValue = 70 + Math.random() * 30; // 70-100% congestion risk
        } else if (hour >= 17 && hour <= 19) {
          predictionValue = 80 + Math.random() * 20; // 80-100% congestion risk
        } else if (hour >= 10 && hour <= 16) {
          predictionValue = 30 + Math.random() * 30; // 30-60% congestion risk
        } else {
          predictionValue = 10 + Math.random() * 20; // 10-30% congestion risk
        }
        
        return {
          hour,
          congestionRisk: Math.round(predictionValue)
        };
      });
      
      // Create weekly prediction pattern
      const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const weeklyPrediction = weekdays.map(day => {
        let predictionValue;
        
        // Higher congestion on weekdays, especially Friday
        if (day === "Friday") {
          predictionValue = 85;
        } else if (day === "Saturday" || day === "Sunday") {
          predictionValue = 40;
        } else {
          predictionValue = 70;
        }
        
        return {
          day,
          congestionRisk: predictionValue
        };
      });
      
      res.json({
        hourly: trafficPrediction,
        weekly: weeklyPrediction
      });
    } catch (error) {
      console.error("Error fetching traffic prediction:", error);
      res.status(500).json({ message: "Failed to fetch traffic prediction" });
    }
  });
}
