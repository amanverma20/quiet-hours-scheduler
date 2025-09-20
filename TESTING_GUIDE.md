# 🧪 CRON Testing Guide

## Method 1: Quick Test (No Emails)
1. Click "Test CRON" button in dashboard
2. See what CRON would do right now
3. Result: "Blocks found: X, Notifications sent: X"

## Method 2: Create Test Blocks for Email Testing

### Step 1: Create a Block Starting in 10 Minutes
1. Go to dashboard
2. Click "Create New Block"
3. Fill in:
   - Title: "Test Study Block"
   - Start Time: [Current time + 10 minutes]
   - End Time: [Current time + 60 minutes]
4. Click "Create Block"

### Step 2: Wait and Test
- Wait 9 minutes
- Click "Test CRON" button
- Should see: "Blocks found: 1, Notifications sent: 1"
- Check your email for the reminder!

### Step 3: Verify No Duplicates
- Click "Test CRON" again immediately
- Should see: "Blocks found: 0, Notifications sent: 0"
- This proves duplicate prevention works!

## Method 3: Manual CRON Trigger via API

```bash
# Direct CRON call (requires secret key)
curl -X POST http://localhost:3001/api/cron \
  -H "x-cron-key: your_cron_secret_key" \
  -H "Content-Type: application/json"

# Response:
{
  "success": true,
  "blocksFound": 1,
  "notificationsSent": 1,
  "errors": 0,
  "timestamp": "2024-01-15T14:00:00.000Z"
}
```

## Method 4: Test Email System First

```bash
# Test email functionality
curl -X POST http://localhost:3001/api/test-email \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json"
```

## Expected Test Results

### ✅ Successful CRON Test:
```
✅ CRON test completed!

Blocks found: 1
Notifications sent: 1
Errors: 0

Triggered by: your@email.com
```

### ❌ No Blocks to Process:
```
✅ CRON test completed!

Blocks found: 0
Notifications sent: 0
Errors: 0

Triggered by: your@email.com
```

### 📧 Email You Should Receive:
```
Subject: 🔔 Quiet Study Reminder: Test Study Block

Hi [Your Name],

This is a friendly reminder that your quiet study block "Test Study Block" starts in 10 minutes.

Start Time: Monday, January 15, 2024 at 2:10 PM

Please prepare your study space and get ready for a productive quiet study session! 📚

Best regards,
Quiet Hours Scheduler
```

## Troubleshooting

### Issue: "Blocks found: 0"
- Check if block start time is exactly 10 minutes from now
- Verify block wasn't already processed (notification_sent = true)
- Look at MongoDB to see actual block data

### Issue: "Notifications sent: 0" but blocks found
- Check email configuration (SENDGRID_API_KEY, EMAIL_FROM)
- Test email system separately first
- Check console logs for email errors

### Issue: "CRON test failed: Unauthorized"
- Add CRON_SECRET_KEY to .env.local
- Restart development server
- Try again

## MongoDB Queries for Debugging

```javascript
// Check blocks in MongoDB
db.blocks.find({}).sort({start_time: 1})

// Check notification status
db.blocks.find({notification_sent: true})

// Find blocks starting soon
db.blocks.find({
  start_time: {
    $gte: new Date(),
    $lt: new Date(Date.now() + 15 * 60 * 1000) // Next 15 minutes
  }
})
```