import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
