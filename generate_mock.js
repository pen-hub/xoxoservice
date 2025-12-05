const fs = require("fs");

// Generate mock data for ORDER_FLOW.md specification
function generateMockData() {
  const workflows = generateWorkflows();
  const employees = generateEmployees();
  const orders = generateOrders(20, workflows, employees);

  const mockData = {
    workflows,
    employees,
    orders,
    metadata: {
      generated_at: new Date().toISOString(),
      specification: "ORDER_FLOW.md Firebase Realtime Database",
      total_workflows: Object.keys(workflows).length,
      total_employees: Object.keys(employees).length,
      total_orders: Object.keys(orders).length,
    },
  };

  fs.writeFileSync(
    "order_flow_mock_data.json",
    JSON.stringify(mockData, null, 2)
  );
  console.log(
    "✅ Generated order_flow_mock_data.json according to ORDER_FLOW.md spec!"
  );
  console.log(
    `📊 ${Object.keys(workflows).length} workflows, ${
      Object.keys(employees).length
    } employees, ${Object.keys(orders).length} orders`
  );
  console.log(
    `📁 File size: ${(
      fs.statSync("order_flow_mock_data.json").size / 1024
    ).toFixed(1)} KB`
  );
}

function generateWorkflows() {
  const workflowTemplates = [
    { name: "Cutting", defaultEmployees: ["NV001", "NV002"] },
    { name: "Sewing", defaultEmployees: ["NV001"] },
    { name: "Quality Control", defaultEmployees: ["NV004"] },
    { name: "Packaging", defaultEmployees: ["NV002", "NV005"] },
    { name: "Washing", defaultEmployees: ["NV003"] },
    { name: "Ironing", defaultEmployees: ["NV002"] },
    { name: "Embroidery", defaultEmployees: ["NV006"] },
    { name: "Button Sewing", defaultEmployees: ["NV001", "NV002"] },
  ];

  const workflows = {};

  workflowTemplates.forEach((template, index) => {
    const workflowId = `workflowId${String(index + 1).padStart(3, "0")}`;
    workflows[workflowId] = {
      name: template.name,
      defaultEmployees: template.defaultEmployees,
      createdAt: getTimestamp(randomInt(30, 365)), // Created 30-365 days ago
    };
  });

  return workflows;
}

function generateEmployees() {
  const employeeData = [
    { id: "NV001", name: "Nguyen Van A", role: "worker" },
    { id: "NV002", name: "Tran Thi B", role: "worker" },
    { id: "NV003", name: "Le Van C", role: "worker" },
    { id: "NV004", name: "Pham Thi D", role: "qc" },
    { id: "NV005", name: "Hoang Van E", role: "worker" },
    { id: "NV006", name: "Vo Thi F", role: "specialist" },
    { id: "NV007", name: "Dang Van G", role: "worker" },
    { id: "NV008", name: "Bui Thi H", role: "qc" },
    { id: "NV009", name: "Do Van Sale", role: "sale" },
    { id: "NV010", name: "Ngo Thi Manager", role: "manager" },
  ];

  const employees = {};
  employeeData.forEach((emp) => {
    employees[emp.id] = {
      name: emp.name,
      role: emp.role,
    };
  });

  return employees;
}

function generateOrders(count, workflows, employees) {
  const orders = {};
  const customerNames = [
    "Linh",
    "Mai",
    "Hoa",
    "Lan",
    "Thu",
    "Hong",
    "Nga",
    "Ly",
    "Minh",
    "Duc",
  ];
  const productNames = [
    "Women's T-Shirt",
    "Men's Polo",
    "Kids Dress",
    "Hoodie",
    "Tank Top",
    "Jeans",
    "Skirt",
    "Blouse",
    "Sweater",
    "Shorts",
  ];
  const salesStaff = ["NV009", "NV010"];

  for (let i = 0; i < count; i++) {
    const orderId = `orderId${String(i + 1).padStart(3, "0")}`;
    const orderCode = `ORD${String(i + 1).padStart(3, "0")}`;
    const createdAt = getTimestamp(randomInt(1, 90)); // Created 1-90 days ago

    // Generate 1-3 products per order
    const productCount = randomInt(1, 3);
    const products = {};

    for (let j = 0; j < productCount; j++) {
      const productId = `productId${String(j + 1).padStart(3, "0")}`;
      const productName = randomChoice(productNames);
      const quantity = randomInt(50, 500);

      // Generate steps for this product based on workflow templates
      const steps = generateStepsForProduct(workflows, createdAt, quantity);

      products[productId] = {
        name: productName,
        quantity: quantity,
        steps: steps,
      };
    }

    orders[orderId] = {
      code: orderCode,
      customerName: randomChoice(customerNames),
      createdBy: randomChoice(salesStaff),
      createdAt: createdAt,
      products: products,
    };
  }

  return orders;
}

function generateStepsForProduct(workflows, orderCreatedAt, productQuantity) {
  const steps = {};
  const workflowIds = Object.keys(workflows);

  // Each product gets 3-5 random workflow steps
  const stepCount = randomInt(3, 5);
  const selectedWorkflows = shuffleArray([...workflowIds]).slice(0, stepCount);

  selectedWorkflows.forEach((workflowId, index) => {
    const stepId = `step${index + 1}`;
    const workflow = workflows[workflowId];

    // Convert defaultEmployees array to object map
    const employees = {};
    workflow.defaultEmployees.forEach((empId) => {
      employees[empId] = true;
    });

    // Generate realistic progress
    const status = randomChoice(["pending", "in_progress", "completed"]);
    let completedQuantity = 0;

    if (status === "completed") {
      completedQuantity = productQuantity;
    } else if (status === "in_progress") {
      completedQuantity = randomInt(0, Math.floor(productQuantity * 0.8));
    }

    steps[stepId] = {
      workflowId: workflowId,
      name: workflow.name,
      employees: employees,
      status: status,
      completedQuantity: completedQuantity,
      updatedAt: orderCreatedAt + randomInt(0, 86400 * 7), // Updated within 7 days of order creation
    };
  });

  return steps;
}

// Utility functions
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getTimestamp(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return Math.floor(date.getTime() / 1000); // Unix timestamp
}

// Run the generator
generateMockData();

// Utility functions
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getTimestamp(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return Math.floor(date.getTime() / 1000); // Unix timestamp
}

// Run the generator
generateMockData();
