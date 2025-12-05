const admin = require("firebase-admin");
const fs = require("fs");

// Initialize Firebase Admin SDK
// Bạn cần tải service account key từ Firebase Console
const serviceAccount = require("./firebase-service-account-key.json"); // Tạo file này

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://morata-a9eba-default-rtdb.asia-southeast1.firebasedatabase.app/",
});

async function importMockData() {
  try {
    const db = admin.database();

    // Read mock data
    const mockData = JSON.parse(
      fs.readFileSync("./order_flow_mock_data.json", "utf8")
    );

    console.log("🚀 Starting data import...");

    // Import workflows
    await db.ref("xoxo/workflows").set(mockData.workflows);
    console.log("✅ Workflows imported");

    // Import employees
    await db.ref("xoxo/employees").set(mockData.employees);
    console.log("✅ Employees imported");

    // Import orders
    await db.ref("xoxo/orders").set(mockData.orders);
    console.log("✅ Orders imported");

    // Import metadata
    await db.ref("xoxo/metadata").set(mockData.metadata);
    console.log("✅ Metadata imported");

    console.log("🎉 All data imported successfully!");
    console.log(
      `📊 ${Object.keys(mockData.workflows).length} workflows, ${
        Object.keys(mockData.employees).length
      } employees, ${Object.keys(mockData.orders).length} orders`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

importMockData();
