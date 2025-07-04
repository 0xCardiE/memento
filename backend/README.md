# Memento Backend - AI Generator Service

This backend service listens for `MementoRequested` events from the smart contract and automatically generates AI artwork using OpenAI's DALL-E API, stores it on SWARM, and updates the NFT URI.

## Features

- 🎨 **AI Image Generation**: Uses OpenAI DALL-E 3 for high-quality image generation
- 📦 **SWARM Storage**: Decentralized storage using existing SWARM infrastructure
- ⛓️ **Smart Contract Integration**: Automatically updates NFT URIs after generation
- 🔄 **Event Monitoring**: Watches for new memento requests in real-time
- 🛡️ **Error Handling**: Robust error handling and retry logic
- 🚀 **PM2 Process Management**: Production-ready process management with auto-restart

## Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Install PM2 (Process Manager)**
   ```bash
   npm install -g pm2
   ```

3. **Configure Environment Variables**
   Create a `.env` file with the following variables:
   ```env
   ADMIN_PRIVATE_KEY=your-admin-private-key-here
   CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   RPC_URL=http://127.0.0.1:8545
   OPENAI_API_KEY=your-openai-api-key-here
   SWARM_GATEWAY=http://localhost:5555
   ```

   **⚠️ Security Note**: Never commit your private keys to version control!

## Running the Service

### **Development Mode**
```bash
# Simple development run
npm run dev

# or direct node execution
node index2.js
```

### **Production Mode with PM2**

4. **Start with PM2**
   ```bash
   # Start the AI generator service
   pm2 start index2.js --name memento-ai-generator

   # Start SWARM gateway (if needed)
   pm2 start index.js --name memento-swarm-gateway

   # Save PM2 configuration
   pm2 save
   ```

5. **PM2 Management Commands**
   ```bash
   # View running processes
   pm2 list

   # View logs
   pm2 logs memento-ai-generator

   # Monitor in real-time
   pm2 monit

   # Restart service
   pm2 restart memento-ai-generator

   # Stop service
   pm2 stop memento-ai-generator

   # Delete service
   pm2 delete memento-ai-generator
   ```

6. **Auto-start on System Boot**
   ```bash
   # Generate startup script
   pm2 startup

   # Follow the command it provides, then:
   pm2 save
   ```

## PM2 Configuration File

Create `ecosystem.config.js` for advanced PM2 configuration:

```javascript
module.exports = {
  apps: [
    {
      name: 'memento-ai-generator',
      script: 'index2.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
```

Then start with:
```bash
pm2 start ecosystem.config.js
```

## How It Works

1. **Event Listening**: The service monitors the smart contract for `MementoRequested` events
2. **AI Generation**: When a new event is detected, it generates an image using the provided AI prompt
3. **SWARM Storage**: The generated image is stored on the SWARM network
4. **NFT Update**: The NFT URI is updated with the final bzz.link URL

## Process Flow

```
User pays & submits prompt → Contract emits MementoRequested event
                                      ↓
Backend detects event → Generate AI image with DALL-E
                                      ↓
Download & store image on SWARM → Get bzz.link URL
                                      ↓
Update NFT URI in contract → NFT now has final artwork
```

## URLs

- **Final NFT Images**: `https://bzz.link/bzz/[swarm-hash]`
- **Contract Events**: Monitored automatically via RPC connection
- **SWARM Gateway**: `http://localhost:5555` (updated port)

## Error Handling

The service includes comprehensive error handling:
- **AI Generation Failures**: Logged and can be retried
- **SWARM Upload Failures**: Automatic retry with different batch IDs
- **Contract Update Failures**: Logged for manual intervention
- **Network Issues**: Automatic reconnection and retry logic
- **PM2 Auto-restart**: Automatically restarts if process crashes

## Monitoring

### **PM2 Monitoring**
```bash
# Real-time monitoring dashboard
pm2 monit

# View logs
pm2 logs memento-ai-generator --lines 50

# View process status
pm2 status
```

### **Console Output**
Watch the logs for real-time processing status:
- 📡 Event detection
- 🎨 AI generation progress
- 📦 SWARM storage confirmations
- ⛓️ Contract updates
- 🎉 Success notifications

## Production Considerations

For production deployment:
1. ✅ **Use PM2** for process management and auto-restart
2. ✅ **Environment Variables** - Store all sensitive keys in `.env`
3. ✅ **Logging** - PM2 handles log rotation and management
4. ✅ **Monitoring** - Use PM2's built-in monitoring features
5. **Security** - Use environment-specific private keys and contract addresses
6. **Scaling** - Consider running multiple instances for high load
7. **Alerts** - Set up alerts for failed generations or service downtime
8. **Backup** - Monitor SWARM batch utilization and costs

## Troubleshooting

### **Common Issues**

1. **Missing Environment Variables**
   ```bash
   # Check if .env file exists and has required variables
   cat .env
   ```

2. **PM2 Process Not Starting**
   ```bash
   # Check PM2 logs for errors
   pm2 logs memento-ai-generator
   ```

3. **SWARM Connection Issues**
   ```bash
   # Test SWARM gateway connection
   curl http://localhost:5555/health
   ```

4. **Contract Connection Issues**
   ```bash
   # Verify RPC connection
   curl -X POST -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
     http://127.0.0.1:8545
   ```

### **Logs Location**
- PM2 logs: `~/.pm2/logs/`
- Custom logs: `./logs/` (if using ecosystem.config.js)
- Console output: `pm2 logs memento-ai-generator` 