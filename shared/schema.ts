import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name"), // Optional field
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

// Incidents table
export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // accident, traffic, closure, police, hazard, other
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  comment: text("comment"),
  reportedBy: integer("reported_by").notNull(), // user id who reported the incident
  createdAt: timestamp("created_at").defaultNow().notNull(),
  active: boolean("active").default(true).notNull(),
  confirmed: integer("confirmed").default(0).notNull(),
  refuted: integer("refuted").default(0).notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertIncidentSchema = createInsertSchema(incidents).pick({
  type: true,
  latitude: true,
  longitude: true,
  comment: true,
  reportedBy: true,
});

// Incident verifications
export const incidentVerifications = pgTable("incident_verifications", {
  id: serial("id").primaryKey(),
  incidentId: integer("incident_id").notNull(),
  userId: integer("user_id").notNull(),
  isConfirmed: boolean("is_confirmed").notNull(), // true = confirmed, false = denied
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVerificationSchema = createInsertSchema(incidentVerifications).pick({
  incidentId: true,
  userId: true,
  isConfirmed: true,
});

// Routes table
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  routeData: jsonb("route_data").notNull(), // store TomTom route data
  avoidTolls: boolean("avoid_tolls").default(false).notNull(),
  avoidHighways: boolean("avoid_highways").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  shareCode: text("share_code").unique(),
});

export const insertRouteSchema = createInsertSchema(routes).pick({
  userId: true,
  origin: true,
  destination: true,
  routeData: true,
  avoidTolls: true,
  avoidHighways: true,
  shareCode: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;

export type IncidentVerification = typeof incidentVerifications.$inferSelect;
export type InsertVerification = z.infer<typeof insertVerificationSchema>;

export type Route = typeof routes.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;
