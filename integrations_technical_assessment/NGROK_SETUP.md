# 🌐 ngrok Setup Guide for HubSpot Webhooks

## **What is ngrok?**
ngrok creates a secure tunnel to expose your local backend server to the internet, making it accessible to HubSpot for webhook delivery.

## **🚀 Quick Setup Steps:**

### **1. Download ngrok:**
- Go to [ngrok.com](https://ngrok.com)
- Sign up for a free account
- Download ngrok for your OS (Windows/Mac/Linux)

### **2. Install and Authenticate:**
```bash
# Extract ngrok to a folder
# Add ngrok to your PATH or run from the folder

# Authenticate with your authtoken (get this from ngrok dashboard)
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### **3. Start ngrok tunnel:**
```bash
# Expose your backend server (running on port 8000)
ngrok http 8000
```

### **4. Get your public URL:**
After running the command, you'll see:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:8000
```

**Your webhook URL will be:** `https://abc123.ngrok.io/webhooks/hubspot`

## **🔧 HubSpot Webhook Configuration:**

### **1. Go to HubSpot Developer Account:**
- Navigate to [developers.hubspot.com](https://developers.hubspot.com)
- Go to your app settings

### **2. Configure Webhook:**
- **Webhook URL:** `https://abc123.ngrok.io/webhooks/hubspot`
- **Events to subscribe to:**
  - Contact creation
  - Contact updates
  - Deal stage changes
  - Company updates
  - Form submissions

### **3. Test Webhook:**
- Create/update a contact in HubSpot
- Check your backend logs for webhook receipt
- View events in your HubSpot integration page

## **⚠️ Important Notes:**

1. **ngrok URLs change** each time you restart ngrok (free plan)
2. **Update HubSpot webhook URL** when ngrok URL changes
3. **Keep ngrok running** while testing webhooks
4. **Check backend logs** for webhook delivery status

## **🧪 Testing Your Webhook:**

1. **Start your backend:** `uvicorn main:app --reload`
2. **Start ngrok:** `ngrok http 8000`
3. **Copy ngrok URL** and update HubSpot webhook
4. **Trigger events** in HubSpot (create/update contacts)
5. **Check webhook events** in your app

## **🔍 Troubleshooting:**

- **Webhook not received:** Check ngrok tunnel status
- **404 errors:** Verify webhook endpoint path
- **CORS issues:** Check backend CORS configuration
- **ngrok URL changed:** Update HubSpot webhook configuration

## **📱 Alternative: Use ngrok with Custom Domain (Paid):**
```bash
ngrok http 8000 --subdomain=yourcompany-webhooks
# Gives you: https://yourcompany-webhooks.ngrok.io
```
