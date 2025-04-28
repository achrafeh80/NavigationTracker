import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to generate a QR code URL
export function getQRCodeUrl(data: string, size: number): string {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data)}&size=${size}x${size}`;
}

export function getWebSocketUrl(): string {
  const port = import.meta.env.VITE_WS_PORT || 5000;
  const token = localStorage.getItem("token");
  return `ws://localhost:5000/?token=${token}`;
}