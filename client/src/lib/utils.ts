import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to generate a QR code URL
export function getQRCodeUrl(data: string, size: number): string {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data)}&size=${size}x${size}`;
}

export const getWebSocketUrl = (token: string) => {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws"
  const host = window.location.hostname
  const port = import.meta.env.VITE_WS_PORT

  return `${protocol}://${host}:${port}/?token=${token}`
}
