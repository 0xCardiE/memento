# Memento Backend - AI Generator Service

This backend service listens for `MementoRequested` events from the smart contract and automatically generates AI artwork using OpenAI's DALL-E API, stores it on SWARM, and updates the NFT URI.

## Features

- 🎨 **AI Image Generation**: Uses OpenAI DALL-E 3 for high-quality image generation
- 📦 **SWARM Storage**: Decentralized storage with optimized single batch ID
- ⛓️ **Smart Contract Integration**: Automatically updates NFT URIs after generation
- 🔄 **Event Monitoring**: Watches for new memento requests in real-time
- 🛡️ **Error Handling**: Robust error handling and retry logic
- 🚀 **PM2 Process Management**: Production-ready process management with auto-restart

## SWARM Configuration

The service uses a single optimized batch ID for all storage operations:
- **Batch ID**: `c0f65f207052a4d1f338fd5fd3e6452734f4e9ebfb6ecf26127e8bebb47d5278`
- **Storage Duration**: Permanent storage for all AI-generated NFT images
- **Cost Optimization**: Single batch reduces complexity and management overhead

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
   NETWORK=testnet
   RPC_URL=https://testnet.evm.nodes.onflow.org
   OPENAI_API_KEY=your-openai-api-key-here
   SWARM_GATEWAY=http://localhost:5555
   ```

   **Flow EVM Network Configuration**:
   - **Testnet**: `https://testnet.evm.nodes.onflow.org` (Chain ID: 545)
   - **Mainnet**: `https://mainnet.evm.nodes.onflow.org` (Chain ID: 747)
   
   Set `NETWORK=testnet` or `NETWORK=mainnet` to choose the appropriate network.

   **⚠️ Security Note**: Never commit your private keys to version control!

## Running the Service

### **Development Mode**
```bash
# Simple development run
npm run dev

# or direct node execution
node index.js
```

### **Production Mode with PM2**

4. **Start with PM2**
   ```bash
   # Start the AI generator service
   pm2 start index.js --name memento-ai-generator

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
      script: 'index.js',
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
3. **SWARM Storage**: The generated image is stored on the SWARM network using the optimized batch ID
4. **NFT Update**: The NFT URI is updated with the final bzz.link URL

## Process Flow

```
User pays & submits prompt → Contract emits MementoRequested event
                                      ↓
Backend detects event → Generate AI image with DALL-E
                                      ↓
Download & store image on SWARM → Get bzz.link URL (using single batch ID)
                                      ↓
Update NFT URI in contract → NFT now has final artwork
```

## URLs

- **Final NFT Images**: `https://bzz.link/bzz/[swarm-hash]`
- **Contract Events**: Monitored automatically via RPC connection
- **SWARM Gateway**: `http://localhost:5555` (updated port)
- **Batch ID**: `c0f65f207052a4d1f338fd5fd3e6452734f4e9ebfb6ecf26127e8bebb47d5278`

## Error Handling

The service includes comprehensive error handling:
- **AI Generation Failures**: Logged and can be retried
- **SWARM Upload Failures**: Enhanced error reporting with batch ID validation
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
- 📦 SWARM storage confirmations (with batch ID)
- ⛓️ Contract updates
- 🎉 Success notifications

## Production Considerations

For production deployment:
1. ✅ **Use PM2** for process management and auto-restart
2. ✅ **Environment Variables** - Store all sensitive keys in `.env`
3. ✅ **Logging** - PM2 handles log rotation and management
4. ✅ **Monitoring** - Use PM2's built-in monitoring features
5. ✅ **SWARM Optimization** - Single batch ID reduces complexity
6. **Security** - Use environment-specific private keys and contract addresses
7. **Scaling** - Consider running multiple instances for high load
8. **Alerts** - Set up alerts for failed generations or service downtime
9. **Backup** - Monitor SWARM batch utilization and remaining capacity

## Pending NFT Processor

A standalone script to process NFTs that were paid for but haven't been generated yet. This serves as a backup mechanism for the main event listener.

### **Features**

- 🔍 **Finds Pending NFTs**: Queries the contract for paid but ungenerated NFTs
- 🎨 **Processes Missing NFTs**: Generates images for NFTs that were missed by the main service
- 📊 **Detailed Reporting**: Shows processing progress and results
- ⏰ **Cron Job Support**: Can be automated to run every 5 minutes
- 🚀 **One-time Execution**: Can be run manually when needed

### **Usage**

**Manual Execution:**
```bash
# Run once to process all pending NFTs (from project root)
npm run backend:process-pending

# Alternative command
npm run backend:check-pending

# Or run directly
node backend/process-pending.js
```

**Cron Job Setup:**
```bash
# Make the cron script executable
chmod +x cron-process-pending.sh

# Edit your crontab
crontab -e

# Add this line to run every 5 minutes
*/5 * * * * /path/to/memento/backend/cron-process-pending.sh

# Or run every hour
0 * * * * /path/to/memento/backend/cron-process-pending.sh
```

### **Output Example**

```
🚀 Starting pending NFT processor...
✅ Network connected: Chain ID 545
📊 Latest block: 12345
🔍 Checking for pending mementos...
📊 Total mementos in contract: 50
📋 Found 3 pending mementos to process
🎯 Pending Token IDs: 47, 48, 49

📍 Processing 1/3: Token ID 47
🎨 Generating image with prompt: "Geological patterns with vibrant colors..."
✅ Image generated successfully
📥 Downloading image...
🌐 Storing image on SWARM network
✅ Image stored on SWARM: https://bzz.link/bzz/abc123...
🔄 Updating NFT image URI for Token ID: 47
✅ NFT image URI updated successfully

📊 Processing Summary:
✅ Successfully processed: 3
❌ Failed: 0
⏭️  Skipped: 0
📋 Total attempted: 3
```

### **When to Use**

- **After Service Restart**: Process any NFTs that were minted while the service was down
- **Network Issues**: If the main service missed events due to network problems
- **Manual Verification**: Periodic check to ensure all paid NFTs have been generated
- **Deployment**: After deploying new backend code, run once to catch up
- **Monitoring**: Regular automated checks every 5-10 minutes

### **Cron Job Configuration**

The script is designed to be cron-friendly:

```bash
# Every 5 minutes
*/5 * * * * /path/to/memento/backend/cron-process-pending.sh

# Every 10 minutes
*/10 * * * * /path/to/memento/backend/cron-process-pending.sh

# Every hour
0 * * * * /path/to/memento/backend/cron-process-pending.sh

# Every day at 2 AM
0 2 * * * /path/to/memento/backend/cron-process-pending.sh
```

Logs are written to `/var/log/memento-pending-processor.log` by default.

### **Smart Contract Integration**

The script uses the same contract functions as the main service:
- `getPendingMementos()`: Gets list of NFTs that need processing
- `getMemento(tokenId)`: Gets the original prompt and metadata
- `updateMementoUri(tokenId, imageUrl)`: Updates the NFT with the generated image

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
   
   # Check batch ID validity
   curl -X GET "http://localhost:5555/stamps/c0f65f207052a4d1f338fd5fd3e6452734f4e9ebfb6ecf26127e8bebb47d5278"
   ```

4. **Contract Connection Issues**
   ```bash
   # Verify RPC connection
   curl -X POST -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
     http://127.0.0.1:8545
   ```

5. **Pending Processor Issues**
   ```bash
   # Test the pending processor manually
   npm run backend:process-pending
   
   # Check cron job logs
   tail -f /var/log/memento-pending-processor.log
   
   # Verify cron job is running
   crontab -l | grep memento
   ```

### **Logs Location**
- PM2 logs: `~/.pm2/logs/`
- Custom logs: `./logs/` (if using ecosystem.config.js)
- Console output: `pm2 logs memento-ai-generator`
- Pending processor logs: `/var/log/memento-pending-processor.log` 