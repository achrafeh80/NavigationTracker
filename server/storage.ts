import { users, incidents, incidentVerifications, routes } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import type { 
  User, InsertUser, 
  Incident, InsertIncident,
  IncidentVerification, InsertVerification,
  Route, InsertRoute
} from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(name: InsertUser): Promise<User>;
  
  // Incident operations
  createIncident(incident: InsertIncident): Promise<Incident>;
  getActiveIncidents(): Promise<Incident[]>;
  getIncidentById(id: number): Promise<Incident | undefined>;
  updateIncidentStatus(id: number, active: boolean): Promise<void>;
  
  // Incident verification operations
  createVerification(verification: InsertVerification): Promise<IncidentVerification>;
  getUserVerification(incidentId: number, userId: number): Promise<IncidentVerification | undefined>;
  
  // Route operations
  createRoute(route: InsertRoute): Promise<Route>;
  getRoutesByUserId(userId: number): Promise<Route[]>;
  getRouteByShareCode(shareCode: string): Promise<Route | undefined>;
  
  sessionStore: ReturnType<typeof createMemoryStore>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: ReturnType<typeof createMemoryStore>;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

    async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  async deleteUser(userId: number): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }
  async updateUser(userId: number, data: Partial<User>): Promise<void> {
    await db.update(users).set(data).where(eq(users.id, userId));
  }
  async getAllIncidents(): Promise<Incident[]> {
    return await db.select().from(incidents);
  }
  async updateIncident(incidentId: number, data: Partial<Incident>): Promise<void> {
    await db.update(incidents).set(data).where(eq(incidents.id, incidentId));
  }
  async deleteIncident(incidentId: number): Promise<void> {
    await db.delete(incidents).where(eq(incidents.id, incidentId));
  }
  async getAllRoutes(): Promise<Route[]> {
    return await db.select().from(routes);
  }


  // Incident operations
  async createIncident(incident: InsertIncident): Promise<Incident> {
    const [newIncident] = await db.insert(incidents).values(incident).returning();
    return newIncident;
  }

  async getActiveIncidents(): Promise<Incident[]> {
    return db.select().from(incidents).where(eq(incidents.active, true)).orderBy(desc(incidents.createdAt));
  }

  async getIncidentById(id: number): Promise<Incident | undefined> {
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
    return incident;
  }

  async updateIncidentStatus(id: number, active: boolean): Promise<void> {
    await db.update(incidents).set({ active }).where(eq(incidents.id, id));
  }

  // Incident verification operations
  async createVerification(verification: InsertVerification): Promise<IncidentVerification> {
    const [result] = await db.insert(incidentVerifications).values(verification).returning();
    
    // Update confirmation/denial count
    const incident = await this.getIncidentById(verification.incidentId);
    if (incident) {
      const { confirmed, refuted } = incident;
      await db.update(incidents).set({
        confirmed: verification.isConfirmed ? confirmed + 1 : confirmed,
        refuted: !verification.isConfirmed ? refuted + 1 : refuted
      }).where(eq(incidents.id, verification.incidentId));
    }

    return result;
  }

  async getUserVerification(incidentId: number, userId: number): Promise<IncidentVerification | undefined> {
    const [verification] = await db.select().from(incidentVerifications).where(
      and(
        eq(incidentVerifications.incidentId, incidentId),
        eq(incidentVerifications.userId, userId)
      )
    );
    return verification;
  }

  // Route operations
  async createRoute(route: InsertRoute): Promise<Route> {
    const [newRoute] = await db.insert(routes).values(route).returning();
    return newRoute;
  }

  async getRoutesByUserId(userId: number): Promise<Route[]> {
    return db.select().from(routes).where(eq(routes.userId, userId)).orderBy(desc(routes.createdAt));
  }

  async getRouteByShareCode(shareCode: string): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.shareCode, shareCode));
    return route;
  }
}

export const storage = new DatabaseStorage();
