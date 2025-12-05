"use client";

import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  errorEmitter,
  initiateAnonymousSignIn,
  initiateEmailSignIn,
  initiateEmailSignUp,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  useAuth,
  useCollection,
  useDoc,
  useFirebase,
  useFirestore,
  useMemoFirebase,
  useUser,
} from "@/firebase";
import { signOut } from "firebase/auth";
import { collection, doc, limit, query } from "firebase/firestore";
import { useMemo, useState } from "react";

export default function TestFirebasePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [testDocId, setTestDocId] = useState("test-doc-1");
  const [testData, setTestData] = useState('{"name": "Test", "value": 123}');
  const [selectedTest, setSelectedTest] = useState<string>("");

  // ========== TEST HOOKS ==========

  // 1. useFirebase - Lấy tất cả services và user state
  const { firebaseApp, firestore, auth, user, isUserLoading } = useFirebase();

  // 2. useUser - Chỉ lấy thông tin user authentication
  const { user: currentUser, isUserLoading: userLoading } = useUser();

  // 3. useFirestore - Chỉ lấy Firestore instance
  const firestoreInstance = useFirestore();

  // 4. useAuth - Chỉ lấy Auth instance
  const authInstance = useAuth();

  // 5. useDoc - Lắng nghe realtime một document
  const testDocRef = useMemo(() => {
    if (!firestoreInstance) return null;
    return doc(firestoreInstance, "test-collection", testDocId);
  }, [firestoreInstance, testDocId]);

  const {
    data: docData,
    isLoading: docLoading,
    error: docError,
  } = useDoc(testDocRef);

  // 6. useCollection - Lắng nghe realtime một collection
  const testCollectionQuery = useMemoFirebase(() => {
    if (!firestoreInstance) return null;
    const colRef = collection(firestoreInstance, "test-collection");
    return query(colRef, limit(5));
  }, [firestoreInstance]);

  const {
    data: collectionData,
    isLoading: colLoading,
    error: colError,
  } = useCollection(testCollectionQuery);

  // Listen to permission errors
  useState(() => {
    const handlePermissionError = (error: any) => {
      console.error("Global Permission Error:", error);
      alert(`Permission Error: ${error.message}`);
    };

    errorEmitter.on("permission-error", handlePermissionError);

    return () => {
      errorEmitter.off("permission-error", handlePermissionError);
    };
  });

  // ========== TEST FUNCTIONS ==========

  const handleAnonymousSignIn = () => {
    initiateAnonymousSignIn(auth);
    setSelectedTest("Anonymous Sign In");
  };

  const handleEmailSignUp = () => {
    initiateEmailSignUp(auth, email, password);
    setSelectedTest("Email Sign Up");
  };

  const handleEmailSignIn = () => {
    initiateEmailSignIn(auth, email, password);
    setSelectedTest("Email Sign In");
  };

  const handleSignOut = () => {
    signOut(auth);
    setSelectedTest("Sign Out");
  };

  const handleSetDocument = () => {
    if (!testDocRef) return;
    try {
      const data = JSON.parse(testData);
      setDocumentNonBlocking(testDocRef, data, { merge: true });
      setSelectedTest("Set Document (Non-blocking)");
    } catch (e) {
      alert("Invalid JSON data");
    }
  };

  const handleAddDocument = () => {
    if (!firestoreInstance) return;
    try {
      const data = JSON.parse(testData);
      const colRef = collection(firestoreInstance, "test-collection");
      addDocumentNonBlocking(colRef, data);
      setSelectedTest("Add Document (Non-blocking)");
    } catch (e) {
      alert("Invalid JSON data");
    }
  };

  const handleUpdateDocument = () => {
    if (!testDocRef) return;
    try {
      const data = JSON.parse(testData);
      updateDocumentNonBlocking(testDocRef, data);
      setSelectedTest("Update Document (Non-blocking)");
    } catch (e) {
      alert("Invalid JSON data");
    }
  };

  const handleDeleteDocument = () => {
    if (!testDocRef) return;
    deleteDocumentNonBlocking(testDocRef);
    setSelectedTest("Delete Document (Non-blocking)");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Firebase Functions Test Page</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Tests */}
        <div className="space-y-6">
          {/* Authentication Status */}
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
              🔐 Authentication Status
            </h2>
            <div className="space-y-2 text-sm">
              <p>
                <strong>User:</strong>{" "}
                {userLoading
                  ? "Loading..."
                  : user
                  ? user.email || user.uid
                  : "Not authenticated"}
              </p>
              <p>
                <strong>UID:</strong> {user?.uid || "N/A"}
              </p>
              <p>
                <strong>Provider:</strong>{" "}
                {user?.providerData[0]?.providerId || "N/A"}
              </p>
            </div>
          </div>

          {/* Authentication Actions */}
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
              🔑 Authentication Tests
            </h2>
            <div className="space-y-3">
              <button
                onClick={handleAnonymousSignIn}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Anonymous Sign In
              </button>

              <div className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-2 border rounded"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleEmailSignUp}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={handleEmailSignIn}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Sign In
                  </button>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={!user}
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Firestore Operations */}
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
              📄 Firestore Operations
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                value={testDocId}
                onChange={(e) => setTestDocId(e.target.value)}
                placeholder="Document ID"
                className="w-full px-3 py-2 border rounded"
              />
              <textarea
                value={testData}
                onChange={(e) => setTestData(e.target.value)}
                placeholder="JSON Data"
                rows={3}
                className="w-full px-3 py-2 border rounded font-mono text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSetDocument}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                  disabled={!user}
                >
                  Set Doc
                </button>
                <button
                  onClick={handleAddDocument}
                  className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                  disabled={!user}
                >
                  Add Doc
                </button>
                <button
                  onClick={handleUpdateDocument}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  disabled={!user}
                >
                  Update Doc
                </button>
                <button
                  onClick={handleDeleteDocument}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  disabled={!user}
                >
                  Delete Doc
                </button>
              </div>
            </div>
          </div>

          {/* Current Test */}
          {selectedTest && (
            <div className="border rounded-lg p-6 bg-blue-50 shadow-sm">
              <h3 className="font-semibold text-blue-900">Last Action:</h3>
              <p className="text-blue-700">{selectedTest}</p>
            </div>
          )}
        </div>

        {/* Right Column - Documentation & Results */}
        <div className="space-y-6">
          {/* Hook Results */}
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">📊 useDoc Result</h2>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Loading:</strong> {docLoading ? "Yes" : "No"}
              </p>
              <p>
                <strong>Error:</strong> {docError ? docError.message : "None"}
              </p>
              <div>
                <strong>Data:</strong>
                <pre className="mt-2 p-3 bg-gray-50 rounded overflow-auto max-h-48 text-xs">
                  {JSON.stringify(docData, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
              📊 useCollection Result
            </h2>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Loading:</strong> {colLoading ? "Yes" : "No"}
              </p>
              <p>
                <strong>Error:</strong> {colError ? colError.message : "None"}
              </p>
              <p>
                <strong>Count:</strong> {collectionData?.length || 0} documents
              </p>
              <div>
                <strong>Data:</strong>
                <pre className="mt-2 p-3 bg-gray-50 rounded overflow-auto max-h-48 text-xs">
                  {JSON.stringify(collectionData, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Documentation */}
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">📚 Documentation</h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-blue-600">🎯 Hooks:</h3>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>
                    <code className="bg-gray-100 px-1 rounded">
                      useFirebase()
                    </code>{" "}
                    - Lấy tất cả Firebase services + user state
                  </li>
                  <li>
                    <code className="bg-gray-100 px-1 rounded">useUser()</code>{" "}
                    - Chỉ lấy user authentication state
                  </li>
                  <li>
                    <code className="bg-gray-100 px-1 rounded">
                      useFirestore()
                    </code>{" "}
                    - Chỉ lấy Firestore instance
                  </li>
                  <li>
                    <code className="bg-gray-100 px-1 rounded">useAuth()</code>{" "}
                    - Chỉ lấy Auth instance
                  </li>
                  <li>
                    <code className="bg-gray-100 px-1 rounded">
                      useDoc(docRef)
                    </code>{" "}
                    - Realtime listener cho 1 document
                  </li>
                  <li>
                    <code className="bg-gray-100 px-1 rounded">
                      useCollection(query)
                    </code>{" "}
                    - Realtime listener cho collection
                  </li>
                  <li>
                    <code className="bg-gray-100 px-1 rounded">
                      useMemoFirebase()
                    </code>{" "}
                    - Memoize Firestore refs/queries
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-green-600">
                  🔐 Auth Functions:
                </h3>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>
                    <code className="bg-gray-100 px-1 rounded">
                      initiateAnonymousSignIn()
                    </code>{" "}
                    - Đăng nhập ẩn danh (non-blocking)
                  </li>
                  <li>
                    <code className="bg-gray-100 px-1 rounded">
                      initiateEmailSignUp()
                    </code>{" "}
                    - Đăng ký email/password (non-blocking)
                  </li>
                  <li>
                    <code className="bg-gray-100 px-1 rounded">
                      initiateEmailSignIn()
                    </code>{" "}
                    - Đăng nhập email/password (non-blocking)
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-purple-600">
                  📝 Firestore Functions:
                </h3>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>
                    <code className="bg-gray-100 px-1 rounded">
                      setDocumentNonBlocking()
                    </code>{" "}
                    - Set document (non-blocking)
                  </li>
                  <li>
                    <code className="bg-gray-100 px-1 rounded">
                      addDocumentNonBlocking()
                    </code>{" "}
                    - Add document (non-blocking)
                  </li>
                  <li>
                    <code className="bg-gray-100 px-1 rounded">
                      updateDocumentNonBlocking()
                    </code>{" "}
                    - Update document (non-blocking)
                  </li>
                  <li>
                    <code className="bg-gray-100 px-1 rounded">
                      deleteDocumentNonBlocking()
                    </code>{" "}
                    - Delete document (non-blocking)
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-red-600">
                  ⚠️ Error Handling:
                </h3>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>
                    <code className="bg-gray-100 px-1 rounded">
                      errorEmitter
                    </code>{" "}
                    - Global error event system
                  </li>
                  <li>
                    <code className="bg-gray-100 px-1 rounded">
                      FirestorePermissionError
                    </code>{" "}
                    - Custom error với context chi tiết
                  </li>
                  <li>
                    Tất cả hooks và functions tự động emit errors khi có
                    permission denied
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="font-semibold text-yellow-800">💡 Lưu ý:</p>
                <ul className="list-disc pl-5 mt-1 text-yellow-700 space-y-1">
                  <li>Tất cả functions là NON-BLOCKING (không dùng await)</li>
                  <li>
                    Auth state updates được handle bởi onAuthStateChanged
                    listener
                  </li>
                  <li>
                    Firestore updates được handle bởi onSnapshot realtime
                    listeners
                  </li>
                  <li>
                    Phải memoize Firestore refs/queries bằng useMemoFirebase
                  </li>
                  <li>Permission errors được emit globally qua errorEmitter</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
