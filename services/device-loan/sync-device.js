#!/usr/bin/env node

// Quick device sync for testing
const data = JSON.stringify([{
  "id": "sync-evt-1",
  "eventType": "Device.Created",
  "eventTime": new Date().toISOString(),
  "data": {
    "id": "d3",
    "brand": "Apple",
    "model": "MacBook Pro 14",
    "category": "Laptop",
    "description": "14-inch MacBook Pro with M3 chip",
    "availableCount": 5,
    "maxDeviceCount": 10,
    "imageUrl": "",
    "fileUrl": ""
  }
}]);

fetch('http://localhost:7072/api/events/device-sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: data
})
.then(res => res.json())
.then(json => console.log('✅ Device synced:', json))
.catch(err => console.error('❌ Error:', err.message));
