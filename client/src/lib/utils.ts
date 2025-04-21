import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getWebSocketUrl(): string {
  const port = import.meta.env.VITE_WS_PORT || 5000;
  const token = localStorage.getItem("token");
  return `ws://localhost:5000/?token=${token}`;
}