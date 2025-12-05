// Test Firebase connection
// Run: node test-firebase.js

const { initializeApp } = require("firebase/app");
const { getDatabase, ref, get } = require("firebase/database");

const firebaseConfig = {
  apiKey: "AIzaSyAKyd64e7XGEDiDSzv4W9UP-ej11x-2qpM",
  authDomain: "morata-a9eba.firebaseapp.com",
  databaseURL:
    "https://morata-a9eba-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "morata-a9eba",
  storageBucket: "morata-a9eba.appspot.com",
  messagingSenderId: "544190636228",
  appId: "1:544190636228:web:5b59936be85db4cc44a991",
};

async function testFirebase() {
  try {
    console.log("🔥 Initializing Firebase...");
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);

    console.log("🔍 Testing database connection...");

    // Test root
    const rootRef = ref(database, "/");
    const rootSnapshot = await get(rootRef);
    console.log("📊 Root data exists:", rootSnapshot.exists());

    // Test xoxo
    const xoxoRef = ref(database, "xoxo");
    const xoxoSnapshot = await get(xoxoRef);
    console.log("📊 XOXO data exists:", xoxoSnapshot.exists());

    if (xoxoSnapshot.exists()) {
      const data = xoxoSnapshot.val();
      console.log("📊 XOXO keys:", Object.keys(data || {}));

      // Test specific paths
      const paths = ["xoxo/workflows", "xoxo/employees", "xoxo/orders"];
      for (const path of paths) {
        const pathRef = ref(database, path);
        const pathSnapshot = await get(pathRef);
        console.log(`📊 ${path} exists:`, pathSnapshot.exists());
        if (pathSnapshot.exists()) {
          const pathData = pathSnapshot.val();
          console.log(`📊 ${path} keys:`, Object.keys(pathData || {}));
        }
      }
    }

    console.log("✅ Firebase test completed!");
  } catch (error) {
    console.error("❌ Firebase test error:", error);
  }
}

testFirebase();
