import express from "express";
import { storage } from "../storage";
import { z } from "zod";
import { AuthRequestSchema, AuthTokenSchema } from "@shared/schema";
import axios from "axios";
import * as dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// Helper function to log environment variables without exposing sensitive values
function logEnvStatus() {
  console.log("Environment variable status:");
  console.log(`- CLIENT_ID: ${process.env.CLIENT_ID ? "Set" : "Not set"}`);
  console.log(`- CLIENT_SECRET: ${process.env.CLIENT_SECRET ? "Set" : "Not set"}`);
  console.log(`- ACCESS_CODE: ${process.env.ACCESS_CODE ? "Set" : "Not set"}`);
}
// Make sure this exactly matches the URLs provided
const TEST_SERVER_BASE_URL = "http://20.244.56.144/evaluation-service";
const IS_DEMO_MODE = process.env.MODE === 'demo';

// Get credentials to use on the client side (does not expose secrets directly)
router.get("/credentials", (req, res) => {
  // Check if we have the required credentials
  const hasCredentials = !!(process.env.ACCESS_CODE && process.env.CLIENT_ID && process.env.CLIENT_SECRET);
  
  res.json({
    hasCredentials,
    message: hasCredentials ? 
      "Server has the required credentials" : 
      "Missing one or more required credentials"
  });
});

// Authenticate a user
router.post("/authenticate", async (req, res) => {
  try {
    const authData = AuthRequestSchema.parse(req.body);
    
    // Log the status of our environment variables (without exposing values)
    logEnvStatus();
    
    // Log a cleansed version of the authentication data
    console.log("Authentication request with:", {
      email: authData.email,
      name: authData.name,
      rollNo: authData.rollNo,
      accessCode: authData.accessCode ? "Provided by client" : "Empty from client",
      envAccessCode: process.env.ACCESS_CODE ? "Set in environment" : "Not set in environment",
      clientID: authData.clientID ? "Provided by client" : "Empty from client",
      envClientID: process.env.CLIENT_ID ? "Set in environment" : "Not set in environment",
      clientSecret: authData.clientSecret ? "Provided by client" : "Empty from client",
      envClientSecret: process.env.CLIENT_SECRET ? "Set in environment" : "Not set in environment"
    });
    
    // If in demo mode, create a mock auth token
    if (IS_DEMO_MODE) {
      const demoToken = {
        access_token: "demo_access_token",
        token_type: "Bearer",
        expires_in: 3600
      };
      
      await storage.setAuthToken(demoToken);
      return res.json({ success: true, message: "Demo authentication successful" });
    }
    
    // Regular authentication flow
    // Format according to documented API structure with environment variables
    const payload = {
      email: authData.email,
      name: authData.name,
      rollNo: authData.rollNo,
      accessCode: process.env.ACCESS_CODE || authData.accessCode, // Prefer env var over client-sent value
      clientID: process.env.CLIENT_ID || authData.clientID, // Prefer env var over client-sent value
      clientSecret: process.env.CLIENT_SECRET || authData.clientSecret // Prefer env var over client-sent value
    };
    
    // Log environment status without exposing actual values
    logEnvStatus();
    console.log("Auth request payload (user info only):", 
      JSON.stringify({email: payload.email, name: payload.name, rollNo: payload.rollNo}, null, 2));
    
    try {
      const response = await axios.post(`${TEST_SERVER_BASE_URL}/auth`, payload);
      
      console.log("Auth response successful:", 
        response.data && typeof response.data === 'object' ? 'Data received' : 'No data received');
      
      // Validate the response data against our schema
      try {
        const token = AuthTokenSchema.parse(response.data);
        await storage.setAuthToken(token);
        
        res.json({ success: true, message: "Authentication successful" });
      } catch (parseError) {
        console.error("Schema validation error:", parseError);
        // Return the raw response if it doesn't match our schema
        
        // Store the raw response as a token anyway
        await storage.setAuthToken(response.data);
        res.json({ success: true, message: "Authentication successful with unknown format" });
      }
    } catch (error: any) {
      console.error("Authentication error:", 
        error.response?.status || 'No status', 
        error.response?.data || 'No data');
      
      // If server returned an error message, pass it to the client
      if (error.response?.data?.message) {
        return res.status(400).json({ 
          success: false, 
          message: "Authentication failed", 
          error: error.response.data.message 
        });
      }
      
      // Fallback to general error
      return res.status(500).json({ 
        success: false, 
        message: "Authentication failed", 
        error: error.message || 'Unknown error' 
      });
    }
  } catch (error: any) {
    console.error("Authentication error:", error);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials. Please check your client ID, client secret, and access code."
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Authentication failed", 
      error: error.message
    });
  }
});

// Check if a user is authenticated
router.get("/status", async (req, res) => {
  try {
    const token = await storage.getAuthToken();
    
    if (!token) {
      return res.json({ authenticated: false });
    }
    
    // In demo mode, always return authenticated
    if (IS_DEMO_MODE) {
      return res.json({ authenticated: true, demoMode: true });
    }
    
    // Validate the token
    return res.json({ authenticated: true });
  } catch (error) {
    console.error("Auth status check error:", error);
    res.status(500).json({ error: "Failed to check authentication status" });
  }
});

export default router;