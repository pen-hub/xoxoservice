// Simple copy script to copy data from mock JSON
// Run this in browser console on Firebase Console Realtime Database page

// 1. Go to https://console.firebase.google.com/project/your-project/database/data
// 2. Navigate to your database
// 3. Open browser console (F12)
// 4. Paste this code and run

const mockData =
  // PASTE YOUR order_flow_mock_data.json content here

  // Then run:
  // copyToClipboard(JSON.stringify(mockData.workflows, null, 2))
  // Go to xoxo/workflows and paste

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      console.log("✅ Copied to clipboard!");
    });
  };

// Usage:
console.log("📋 Copy commands:");
console.log(
  "1. copyToClipboard(JSON.stringify(mockData.workflows, null, 2)) - for workflows"
);
console.log(
  "2. copyToClipboard(JSON.stringify(mockData.employees, null, 2)) - for employees"
);
console.log(
  "3. copyToClipboard(JSON.stringify(mockData.orders, null, 2)) - for orders"
);
