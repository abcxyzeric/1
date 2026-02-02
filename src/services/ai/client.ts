
import { GoogleGenAI } from "@google/genai";

// Initialize AI Client
// The API key is obtained from the environment variable process.env.API_KEY
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
