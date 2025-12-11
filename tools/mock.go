package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"os"
	"time"
)

// Configuration for mock data generation
type MockConfig struct {
	NumDepartments    int
	NumSalesMembers   int
	NumAdminMembers   int
	NumDevMembers     int
	NumWorkersPerDept int
	NumOrders         int
	NumWarrantyClaims int
	NumMaterials      int
	NumCategories     int
	NumInventoryTxns  int
	NumFinanceTxns    int
	NumRefunds        int
	NumFeedbacks      int
}

var defaultConfig = MockConfig{
	NumDepartments:    5,
	NumSalesMembers:   5,
	NumAdminMembers:   2,
	NumDevMembers:     2,
	NumWorkersPerDept: 3,
	NumOrders:         20,
	NumWarrantyClaims: 5,
	NumMaterials:      15,
	NumCategories:     5,
	NumInventoryTxns:  30,
	NumFinanceTxns:    25,
	NumRefunds:        3,
	NumFeedbacks:      10,
}

// Data structures matching TypeScript interfaces

type Department struct {
	Code      string `json:"code"`
	Name      string `json:"name"`
	CreatedAt int64  `json:"createdAt,omitempty"`
	UpdatedAt int64  `json:"updatedAt,omitempty"`
}

type Member struct {
	Code        string   `json:"code"`
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Phone       string   `json:"phone"`
	Email       string   `json:"email"`
	Role        string   `json:"role"`
	Departments []string `json:"departments,omitempty"`
	DateOfBirth string   `json:"date_of_birth"`
	IsActive    bool     `json:"isActive,omitempty"`
	CreatedAt   int64    `json:"createdAt,omitempty"`
	UpdatedAt   int64    `json:"updatedAt,omitempty"`
}

type Workflow struct {
	Name       string `json:"name"`
	Department string `json:"department,omitempty"`
}

type FirebaseWorkflowData struct {
	DepartmentCode string   `json:"departmentCode,omitempty"`
	WorkflowCode   []string `json:"workflowCode"`
	WorkflowName   []string `json:"workflowName"`
	Members        []string `json:"members"`
	IsDone         bool     `json:"isDone"`
	UpdatedAt      int64    `json:"updatedAt"`
}

type Image struct {
	UID  string `json:"uid"`
	Name string `json:"name"`
	URL  string `json:"url"`
}

type FirebaseProductData struct {
	Name                 string                          `json:"name"`
	Quantity             int                             `json:"quantity"`
	Price                int                             `json:"price"`
	CommissionPercentage float64                         `json:"commissionPercentage,omitempty"`
	Images               []Image                         `json:"images"`
	ImagesDone           []Image                         `json:"imagesDone,omitempty"`
	Workflows            map[string]FirebaseWorkflowData `json:"workflows"`
}

type FirebaseOrderData struct {
	Code           string                         `json:"code"`
	CustomerName   string                         `json:"customerName"`
	Phone          string                         `json:"phone"`
	Email          string                         `json:"email"`
	Address        string                         `json:"address"`
	CustomerSource string                         `json:"customerSource"`
	OrderDate      int64                          `json:"orderDate"`
	DeliveryDate   int64                          `json:"deliveryDate"`
	CreatedBy      string                         `json:"createdBy"`
	CreatedByName  string                         `json:"createdByName"`
	ConsultantID   string                         `json:"consultantId,omitempty"`
	ConsultantName string                         `json:"consultantName,omitempty"`
	CreatedAt      int64                          `json:"createdAt,omitempty"`
	UpdatedAt      int64                          `json:"updatedAt,omitempty"`
	Notes          string                         `json:"notes,omitempty"`
	Discount       int                            `json:"discount,omitempty"`
	DiscountType   string                         `json:"discountType,omitempty"`
	ShippingFee    int                            `json:"shippingFee,omitempty"`
	Products       map[string]FirebaseProductData `json:"products"`
	Status         string                         `json:"status,omitempty"`
	TotalAmount    int                            `json:"totalAmount,omitempty"`
	DiscountAmount int                            `json:"discountAmount,omitempty"`
	Subtotal       int                            `json:"subtotal,omitempty"`
	Deposit        int                            `json:"deposit,omitempty"`
	DepositType    string                         `json:"depositType,omitempty"`
	DepositAmount  int                            `json:"depositAmount,omitempty"`
	IsDepositPaid  bool                           `json:"isDepositPaid,omitempty"`
	CustomerCode   string                         `json:"customerCode,omitempty"`
	Issues         []string                       `json:"issues,omitempty"`
}

type WarrantyClaim struct {
	ID                string                         `json:"id"`
	Code              string                         `json:"code"`
	OriginalOrderID   string                         `json:"originalOrderId"`
	OriginalOrderCode string                         `json:"originalOrderCode"`
	CustomerName      string                         `json:"customerName"`
	Phone             string                         `json:"phone"`
	Email             string                         `json:"email"`
	Address           string                         `json:"address"`
	CustomerSource    string                         `json:"customerSource"`
	OrderDate         int64                          `json:"orderDate"`
	DeliveryDate      int64                          `json:"deliveryDate"`
	CreatedBy         string                         `json:"createdBy"`
	CreatedByName     string                         `json:"createdByName"`
	Products          map[string]FirebaseProductData `json:"products"`
	Status            string                         `json:"status"`
	TotalAmount       int                            `json:"totalAmount,omitempty"`
	Notes             string                         `json:"notes,omitempty"`
	Issues            []string                       `json:"issues,omitempty"`
	CreatedAt         int64                          `json:"createdAt"`
	UpdatedAt         int64                          `json:"updatedAt"`
}

type Category struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Color       string `json:"color,omitempty"`
	CreatedAt   int64  `json:"createdAt,omitempty"`
	UpdatedAt   int64  `json:"updatedAt,omitempty"`
}

type Material struct {
	ID                 string `json:"id"`
	Name               string `json:"name"`
	Category           string `json:"category"`
	StockQuantity      int    `json:"stockQuantity"`
	Unit               string `json:"unit"`
	MinThreshold       int    `json:"minThreshold"`
	MaxCapacity        int    `json:"maxCapacity"`
	Supplier           string `json:"supplier,omitempty"`
	ImportPrice        int    `json:"importPrice,omitempty"`
	LastUpdated        string `json:"lastUpdated,omitempty"`
	LongStockAlertDays int    `json:"longStockAlertDays,omitempty"`
	CreatedAt          int64  `json:"createdAt,omitempty"`
	UpdatedAt          int64  `json:"updatedAt,omitempty"`
}

type InventoryTransaction struct {
	Code         string `json:"code"`
	MaterialID   string `json:"materialId"`
	MaterialName string `json:"materialName"`
	Type         string `json:"type"`
	Quantity     int    `json:"quantity"`
	Unit         string `json:"unit"`
	Price        int    `json:"price,omitempty"`
	TotalAmount  int    `json:"totalAmount,omitempty"`
	Date         string `json:"date"`
	Supplier     string `json:"supplier,omitempty"`
	Reason       string `json:"reason,omitempty"`
	Note         string `json:"note,omitempty"`
	CreatedBy    string `json:"createdBy,omitempty"`
	CreatedAt    int64  `json:"createdAt"`
}

type FinanceTransaction struct {
	ID            string `json:"id"`
	Date          int64  `json:"date"`
	Type          string `json:"type"`
	Category      string `json:"category"`
	Amount        int    `json:"amount"`
	Description   string `json:"description"`
	Reference     string `json:"reference"`
	SourceID      string `json:"sourceId,omitempty"`
	SourceType    string `json:"sourceType,omitempty"`
	CreatedBy     string `json:"createdBy,omitempty"`
	CreatedByName string `json:"createdByName,omitempty"`
	CreatedAt     int64  `json:"createdAt"`
	UpdatedAt     int64  `json:"updatedAt"`
	Notes         string `json:"notes,omitempty"`
	IsManual      bool   `json:"isManual,omitempty"`
}

type RefundRequest struct {
	ID              string `json:"id"`
	OrderID         string `json:"orderId"`
	OrderCode       string `json:"orderCode"`
	Amount          int    `json:"amount"`
	Reason          string `json:"reason"`
	Type            string `json:"type"`
	Status          string `json:"status"`
	RequestedBy     string `json:"requestedBy"`
	RequestedByName string `json:"requestedByName"`
	RequestedAt     int64  `json:"requestedAt"`
	ApprovedBy      string `json:"approvedBy,omitempty"`
	ApprovedByName  string `json:"approvedByName,omitempty"`
	ApprovedAt      int64  `json:"approvedAt,omitempty"`
	RejectedBy      string `json:"rejectedBy,omitempty"`
	RejectedByName  string `json:"rejectedByName,omitempty"`
	RejectedAt      int64  `json:"rejectedAt,omitempty"`
	RejectionReason string `json:"rejectionReason,omitempty"`
	ProcessedBy     string `json:"processedBy,omitempty"`
	ProcessedByName string `json:"processedByName,omitempty"`
	ProcessedDate   int64  `json:"processedDate,omitempty"`
	Notes           string `json:"notes,omitempty"`
	CreatedAt       int64  `json:"createdAt"`
	UpdatedAt       int64  `json:"updatedAt"`
}

type CustomerFeedback struct {
	ID              string `json:"id"`
	OrderID         string `json:"orderId"`
	OrderCode       string `json:"orderCode"`
	CustomerID      string `json:"customerId,omitempty"`
	CustomerName    string `json:"customerName"`
	CustomerPhone   string `json:"customerPhone"`
	FeedbackType    string `json:"feedbackType"`
	Rating          int    `json:"rating,omitempty"`
	Notes           string `json:"notes,omitempty"`
	CollectedBy     string `json:"collectedBy,omitempty"`
	CollectedByName string `json:"collectedByName,omitempty"`
	CollectedAt     int64  `json:"collectedAt"`
	CreatedAt       int64  `json:"createdAt"`
	UpdatedAt       int64  `json:"updatedAt"`
}

type MockData struct {
	Xoxo struct {
		Departments           map[string]Department           `json:"departments"`
		Members               map[string]Member               `json:"members"`
		Workflows             map[string]Workflow             `json:"workflows"`
		Orders                map[string]FirebaseOrderData    `json:"orders"`
		WarrantyClaims        map[string]WarrantyClaim        `json:"warrantyClaims"`
		Categories            map[string]Category             `json:"categories"`
		Materials             map[string]Material             `json:"materials"`
		InventoryTransactions map[string]InventoryTransaction `json:"inventoryTransactions"`
		FinanceTransactions   map[string]FinanceTransaction   `json:"financeTransactions"`
		Refunds               map[string]RefundRequest        `json:"refunds"`
		Feedbacks             map[string]CustomerFeedback     `json:"feedbacks"`
	} `json:"xoxo"`
}

var (
	firstNames  = []string{"Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ"}
	lastNames   = []string{"Văn", "Thị", "Minh", "Hồng", "Lan", "Anh", "Dũng", "Hùng", "Thảo", "Linh"}
	middleNames = []string{"Anh", "Minh", "Thị", "Văn", "Hồng", "Lan", "Dũng", "Hùng", "Thảo", "Linh"}

	departments = []struct {
		Code string
		Name string
	}{
		{"DEPT_001", "Phòng Cắt"},
		{"DEPT_002", "Phòng May"},
		{"DEPT_003", "Phòng Là Ủi"},
		{"DEPT_004", "Phòng Kiểm Tra"},
		{"DEPT_005", "Phòng Đóng Gói"},
	}

	workflowNames = map[string][]string{
		"DEPT_001": {"Cắt vải", "Cắt chỉ", "Cắt phụ liệu"},
		"DEPT_002": {"May thân", "May tay áo", "May cổ áo", "May đường viền"},
		"DEPT_003": {"Là ủi thân", "Là ủi tay áo", "Là ủi hoàn thiện"},
		"DEPT_004": {"Kiểm tra chất lượng", "Kiểm tra kích thước", "Kiểm tra đường may"},
		"DEPT_005": {"Đóng gói", "Dán nhãn", "Bọc bảo vệ"},
	}

	productNames = []string{
		"Áo thun nữ size M",
		"Áo sơ mi nam size L",
		"Quần jeans nam size 32",
		"Váy công sở size S",
		"Áo khoác nữ size M",
		"Quần short nam size 30",
		"Áo len nữ size L",
		"Quần tây nam size 34",
	}

	materialNames = []string{
		"Vải cotton",
		"Vải denim",
		"Vải lụa",
		"Chỉ may",
		"Khóa kéo",
		"Khuy áo",
		"Da bò",
		"Vải thun",
		"Bông vải",
		"Túi vải",
	}

	categoryNames = []string{
		"Vải",
		"Phụ liệu",
		"Da",
		"Hóa chất",
		"Bao bì",
	}

	supplierNames = []string{
		"Công ty Vải ABC",
		"Nhà cung cấp Phụ liệu XYZ",
		"Công ty Da DEF",
		"Nhà cung cấp Hóa chất GHI",
		"Công ty Bao bì JKL",
	}

	// Enum values from enum.ts
	customerSources  = []string{"facebook", "zalo", "instagram", "tiktok", "website", "referral", "walk_in", "phone", "other"}
	roles            = []string{"sales", "worker", "admin", "development"}
	orderStatuses    = []string{"pending", "confirmed", "in_progress", "on_hold", "completed", "cancelled"}
	warrantyStatuses = []string{"pending", "confirmed", "in_progress", "on_hold", "completed", "cancelled"}
	refundStatuses   = []string{"pending", "approved", "rejected", "processed", "cancelled"}
	refundTypes      = []string{"full", "partial", "compensation"}
	discountTypes    = []string{"amount", "percentage"}
	units            = []string{"cai", "hop", "thung", "cuon", "bo", "kg", "g", "mg", "tan", "lit", "ml", "m3", "m", "cm", "mm", "m2", "cm2", "tam", "bao", "palette"}
	feedbackTypes    = []string{"Khen", "Chê", "Bức xúc", "Góp ý"}
	categoryColors   = []string{"#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1", "#eb2f96", "#13c2c2"}
)

func randomName() string {
	firstName := firstNames[rand.Intn(len(firstNames))]
	middleName := middleNames[rand.Intn(len(middleNames))]
	lastName := lastNames[rand.Intn(len(lastNames))]
	return fmt.Sprintf("%s %s %s", firstName, middleName, lastName)
}

func randomPhone() string {
	return fmt.Sprintf("09%08d", rand.Intn(100000000))
}

func randomEmail(name string) string {
	cleanName := ""
	for _, r := range name {
		if r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' || r >= '0' && r <= '9' {
			cleanName += string(r)
		}
	}
	return fmt.Sprintf("%s%d@gmail.com", cleanName, rand.Intn(1000))
}

func randomDateOfBirth() string {
	year := 1980 + rand.Intn(30)
	month := 1 + rand.Intn(12)
	day := 1 + rand.Intn(28)
	return fmt.Sprintf("%04d-%02d-%02d", year, month, day)
}

func generateID(prefix string, index int) string {
	return fmt.Sprintf("%s_%03d", prefix, index+1)
}

func generateCode(prefix string, index int) string {
	now := time.Now()
	return fmt.Sprintf("%s%04d%02d%02d%03d", prefix, now.Year(), int(now.Month()), now.Day(), index+1)
}

func generateMaterialCode(index int) string {
	return fmt.Sprintf("MAT_%06d", index+1)
}

func generateTransactionCode(index int) string {
	return fmt.Sprintf("TXN_%06d", index+1)
}

func generateFinanceCode(index int) string {
	return fmt.Sprintf("FIN_%06d", index+1)
}

func generateWarrantyCode(index int) string {
	now := time.Now()
	return fmt.Sprintf("WC%04d%02d%02d%03d", now.Year(), int(now.Month()), now.Day(), index+1)
}

func generateRefundCode(index int) string {
	now := time.Now()
	return fmt.Sprintf("RF%04d%02d%02d%03d", now.Year(), int(now.Month()), now.Day(), index+1)
}

func generateMockData(config MockConfig) MockData {
	rand.Seed(time.Now().UnixNano())
	now := time.Now().Unix() * 1000

	data := MockData{}

	// Generate Departments
	data.Xoxo.Departments = make(map[string]Department)
	deptList := departments
	if config.NumDepartments < len(departments) {
		deptList = departments[:config.NumDepartments]
	}
	for _, dept := range deptList {
		data.Xoxo.Departments[dept.Code] = Department{
			Code:      dept.Code,
			Name:      dept.Name,
			CreatedAt: now - int64(rand.Intn(30*24*3600*1000)),
		}
	}

	// Generate Members
	data.Xoxo.Members = make(map[string]Member)

	// Fixed members - always include these 3 members
	// Admin member
	adminID := "ADMIN_FIXED_001"
	data.Xoxo.Members[adminID] = Member{
		Code:        adminID,
		ID:          adminID,
		Name:        "Quản trị",
		Phone:       "0900000001",
		Email:       "admin@gmail.com",
		Role:        "admin",
		DateOfBirth: "1985-01-01",
		IsActive:    true,
		CreatedAt:   now - int64(90*24*3600*1000), // Created 90 days ago
		UpdatedAt:   now - int64(90*24*3600*1000),
	}

	// Sales member
	salesID := "SALES_FIXED_001"
	data.Xoxo.Members[salesID] = Member{
		Code:        salesID,
		ID:          salesID,
		Name:        "Bán hàng",
		Phone:       "0900000002",
		Email:       "sale31@gmail.com",
		Role:        "sales",
		DateOfBirth: "1990-01-01",
		IsActive:    true,
		CreatedAt:   now - int64(90*24*3600*1000), // Created 90 days ago
		UpdatedAt:   now - int64(90*24*3600*1000),
	}

	// Worker (Kỹ thuật) member
	workerID := "WORKER_FIXED_001"
	// Assign to first department if available
	var firstDeptCode string
	if len(deptList) > 0 {
		firstDeptCode = deptList[0].Code
	}
	workerDepts := []string{}
	if firstDeptCode != "" {
		workerDepts = []string{firstDeptCode}
	}
	data.Xoxo.Members[workerID] = Member{
		Code:        workerID,
		ID:          workerID,
		Name:        "Kỹ thuật",
		Phone:       "0900000003",
		Email:       "kt@gmail.com",
		Role:        "worker",
		Departments: workerDepts,
		DateOfBirth: "1992-01-01",
		IsActive:    true,
		CreatedAt:   now - int64(90*24*3600*1000), // Created 90 days ago
		UpdatedAt:   now - int64(90*24*3600*1000),
	}

	// Generate sales members
	for i := 0; i < config.NumSalesMembers; i++ {
		id := generateID("SALES", i)
		name := randomName()
		member := Member{
			Code:        id,
			ID:          id,
			Name:        name,
			Phone:       randomPhone(),
			Email:       randomEmail(name),
			Role:        "sales",
			DateOfBirth: randomDateOfBirth(),
			IsActive:    true,
			CreatedAt:   now - int64(rand.Intn(30*24*3600*1000)),
		}
		data.Xoxo.Members[id] = member
	}

	// Generate admin members
	for i := 0; i < config.NumAdminMembers; i++ {
		id := generateID("ADMIN", i)
		name := randomName()
		member := Member{
			Code:        id,
			ID:          id,
			Name:        name,
			Phone:       randomPhone(),
			Email:       randomEmail(name),
			Role:        "admin",
			DateOfBirth: randomDateOfBirth(),
			IsActive:    true,
			CreatedAt:   now - int64(rand.Intn(30*24*3600*1000)),
		}
		data.Xoxo.Members[id] = member
	}

	// Generate dev members
	for i := 0; i < config.NumDevMembers; i++ {
		id := generateID("DEV", i)
		name := randomName()
		member := Member{
			Code:        id,
			ID:          id,
			Name:        name,
			Phone:       randomPhone(),
			Email:       randomEmail(name),
			Role:        "development",
			DateOfBirth: randomDateOfBirth(),
			IsActive:    true,
			CreatedAt:   now - int64(rand.Intn(30*24*3600*1000)),
		}
		data.Xoxo.Members[id] = member
	}

	// Generate worker members (with departments)
	workerIndex := 0
	for _, dept := range deptList {
		for j := 0; j < config.NumWorkersPerDept; j++ {
			id := generateID("WORKER", workerIndex)
			name := randomName()
			member := Member{
				Code:        id,
				ID:          id,
				Name:        name,
				Phone:       randomPhone(),
				Email:       randomEmail(name),
				Role:        "worker",
				Departments: []string{dept.Code},
				DateOfBirth: randomDateOfBirth(),
				IsActive:    true,
				CreatedAt:   now - int64(rand.Intn(30*24*3600*1000)),
			}
			data.Xoxo.Members[id] = member
			workerIndex++
		}
	}

	// Generate Workflows (linked to departments)
	data.Xoxo.Workflows = make(map[string]Workflow)
	workflowIndex := 0
	for _, dept := range deptList {
		workflowNamesForDept := workflowNames[dept.Code]
		for _, workflowName := range workflowNamesForDept {
			id := generateID("WF", workflowIndex)
			data.Xoxo.Workflows[id] = Workflow{
				Name:       workflowName,
				Department: dept.Code,
			}
			workflowIndex++
		}
	}

	// Generate Categories
	data.Xoxo.Categories = make(map[string]Category)
	for i := 0; i < config.NumCategories && i < len(categoryNames); i++ {
		categoryCode := fmt.Sprintf("CAT_%03d", i+1)
		data.Xoxo.Categories[categoryCode] = Category{
			Code:        categoryCode,
			Name:        categoryNames[i],
			Description: fmt.Sprintf("Danh mục %s", categoryNames[i]),
			Color:       categoryColors[i%len(categoryColors)],
			CreatedAt:   now - int64(rand.Intn(30*24*3600*1000)),
			UpdatedAt:   now - int64(rand.Intn(30*24*3600*1000)),
		}
	}

	// Generate Materials (linked to categories)
	data.Xoxo.Materials = make(map[string]Material)
	materialCategoryMap := map[string]string{
		"Vải cotton": "Vải",
		"Vải denim":  "Vải",
		"Vải lụa":    "Vải",
		"Vải thun":   "Vải",
		"Chỉ may":    "Phụ liệu",
		"Khóa kéo":   "Phụ liệu",
		"Khuy áo":    "Phụ liệu",
		"Da bò":      "Da",
		"Bông vải":   "Vải",
		"Túi vải":    "Bao bì",
	}

	materialUnitMap := map[string]string{
		"Vải cotton": "m2",
		"Vải denim":  "m2",
		"Vải lụa":    "m2",
		"Vải thun":   "m2",
		"Chỉ may":    "cuon",
		"Khóa kéo":   "cai",
		"Khuy áo":    "cai",
		"Da bò":      "m2",
		"Bông vải":   "kg",
		"Túi vải":    "cai",
	}

	for i := 0; i < config.NumMaterials && i < len(materialNames); i++ {
		materialName := materialNames[i]
		materialID := generateMaterialCode(i)
		category := materialCategoryMap[materialName]
		if category == "" {
			category = categoryNames[rand.Intn(len(categoryNames))]
		}
		unit := materialUnitMap[materialName]
		if unit == "" {
			unit = units[rand.Intn(len(units))]
		}

		stockQuantity := 100 + rand.Intn(900)
		minThreshold := 50 + rand.Intn(100)
		maxCapacity := stockQuantity + 500 + rand.Intn(1000)
		importPrice := 10000 + rand.Intn(100000)

		material := Material{
			ID:                 materialID,
			Name:               materialName,
			Category:           category,
			StockQuantity:      stockQuantity,
			Unit:               unit,
			MinThreshold:       minThreshold,
			MaxCapacity:        maxCapacity,
			Supplier:           supplierNames[rand.Intn(len(supplierNames))],
			ImportPrice:        importPrice,
			LastUpdated:        time.Now().AddDate(0, 0, -rand.Intn(30)).Format("2006-01-02"),
			LongStockAlertDays: 30 + rand.Intn(60),
			CreatedAt:          now - int64(rand.Intn(60*24*3600*1000)),
			UpdatedAt:          now - int64(rand.Intn(7*24*3600*1000)),
		}
		data.Xoxo.Materials[materialID] = material
	}

	// Get sales member IDs for createdBy
	salesMemberIDs := make([]string, 0)
	for id, member := range data.Xoxo.Members {
		if member.Role == "sales" {
			salesMemberIDs = append(salesMemberIDs, id)
		}
	}

	// Generate Orders
	data.Xoxo.Orders = make(map[string]FirebaseOrderData)
	orderCodes := make([]string, 0)

	for i := 0; i < config.NumOrders; i++ {
		orderID := fmt.Sprintf("ORD_%03d", i+1)
		orderCode := fmt.Sprintf("ORD%04d%02d%02d%03d",
			time.Now().Year(),
			int(time.Now().Month()),
			time.Now().Day(),
			i+1)

		createdBy := salesMemberIDs[rand.Intn(len(salesMemberIDs))]
		createdByName := data.Xoxo.Members[createdBy].Name

		orderDate := now - int64(rand.Intn(30*24*3600*1000))
		deliveryDate := orderDate + int64((3+rand.Intn(10))*24*3600*1000)

		// Generate products for this order
		numProducts := 1 + rand.Intn(3)
		products := make(map[string]FirebaseProductData)

		for j := 0; j < numProducts; j++ {
			productID := fmt.Sprintf("PROD_%s_%d", orderID, j+1)
			productName := productNames[rand.Intn(len(productNames))]
			quantity := 10 + rand.Intn(100)
			price := 50000 + rand.Intn(500000)

			// Generate workflows for this product
			productWorkflows := make(map[string]FirebaseWorkflowData)

			selectedDepts := make([]string, 0)
			numDepts := 2 + rand.Intn(3)
			deptIndices := rand.Perm(len(deptList))[:numDepts]

			for _, idx := range deptIndices {
				dept := deptList[idx]
				selectedDepts = append(selectedDepts, dept.Code)
			}

			workflowIndexInProduct := 0
			for _, deptCode := range selectedDepts {
				availableWorkflows := make([]string, 0)
				for wfID, wf := range data.Xoxo.Workflows {
					if wf.Department == deptCode {
						availableWorkflows = append(availableWorkflows, wfID)
					}
				}

				if len(availableWorkflows) > 0 {
					numWorkflows := 1 + rand.Intn(2)
					if numWorkflows > len(availableWorkflows) {
						numWorkflows = len(availableWorkflows)
					}

					selectedWorkflowIDs := availableWorkflows[:numWorkflows]
					workflowCodes := make([]string, 0)
					workflowNamesList := make([]string, 0)

					for _, wfID := range selectedWorkflowIDs {
						workflowCodes = append(workflowCodes, wfID)
						workflowNamesList = append(workflowNamesList, data.Xoxo.Workflows[wfID].Name)
					}

					availableMembers := make([]string, 0)
					for memberID, member := range data.Xoxo.Members {
						if member.Role == "worker" {
							for _, memberDept := range member.Departments {
								if memberDept == deptCode {
									availableMembers = append(availableMembers, memberID)
									break
								}
							}
						}
					}

					numMembers := 1 + rand.Intn(2)
					if numMembers > len(availableMembers) {
						numMembers = len(availableMembers)
					}

					assignedMembers := make([]string, 0)
					if numMembers > 0 {
						memberIndices := rand.Perm(len(availableMembers))[:numMembers]
						for _, idx := range memberIndices {
							assignedMembers = append(assignedMembers, availableMembers[idx])
						}
					}

					isDone := workflowIndexInProduct < 2 && rand.Float32() < 0.7

					workflowID := fmt.Sprintf("workflow_%s_%d", productID, workflowIndexInProduct)
					productWorkflows[workflowID] = FirebaseWorkflowData{
						DepartmentCode: deptCode,
						WorkflowCode:   workflowCodes,
						WorkflowName:   workflowNamesList,
						Members:        assignedMembers,
						IsDone:         isDone,
						UpdatedAt:      orderDate + int64(workflowIndexInProduct*3600*1000),
					}
					workflowIndexInProduct++
				}
			}

			imageURL := "https://firebasestorage.googleapis.com/v0/b/morata-8e8e4.appspot.com/o/images%2Fproduct.jpg?alt=media&token=2d68623c-9ee8-4c1d-905b-c5155ba427ed"
			numImages := 1 + rand.Intn(3)
			images := make([]Image, 0)
			for k := 0; k < numImages; k++ {
				images = append(images, Image{
					UID:  fmt.Sprintf("img_%s_%d", productID, k),
					Name: fmt.Sprintf("product_%d.jpg", k+1),
					URL:  imageURL,
				})
			}

			var imagesDone []Image
			hasCompletedWorkflows := false
			for _, wf := range productWorkflows {
				if wf.IsDone {
					hasCompletedWorkflows = true
					break
				}
			}
			if hasCompletedWorkflows && rand.Float32() < 0.6 {
				numImagesDone := 1 + rand.Intn(2)
				imagesDone = make([]Image, 0)
				for k := 0; k < numImagesDone; k++ {
					imagesDone = append(imagesDone, Image{
						UID:  fmt.Sprintf("img_done_%s_%d", productID, k),
						Name: fmt.Sprintf("product_done_%d.jpg", k+1),
						URL:  imageURL,
					})
				}
			}

			products[productID] = FirebaseProductData{
				Name:                 productName,
				Quantity:             quantity,
				Price:                price,
				CommissionPercentage: 5.0 + rand.Float64()*10.0,
				Images:               images,
				ImagesDone:           imagesDone,
				Workflows:            productWorkflows,
			}
		}

		subtotal := 0
		for _, product := range products {
			subtotal += product.Price * product.Quantity
		}

		discountType := discountTypes[rand.Intn(len(discountTypes))]
		discount := 0
		if rand.Float32() < 0.5 {
			if discountType == "percentage" {
				discount = 5 + rand.Intn(15)
			} else {
				discount = 50000 + rand.Intn(200000)
			}
		}
		discountAmount := 0
		if discount > 0 {
			if discountType == "percentage" {
				discountAmount = (subtotal * discount) / 100
			} else {
				discountAmount = discount
			}
		}

		shippingFee := 0
		if rand.Float32() < 0.7 {
			shippingFee = 20000 + rand.Intn(50000)
		}

		totalAmount := subtotal - discountAmount + shippingFee

		deposit := 0
		depositAmount := 0
		isDepositPaid := false
		if rand.Float32() < 0.6 {
			deposit = 30 + rand.Intn(40)
			depositAmount = (totalAmount * deposit) / 100
			isDepositPaid = rand.Float32() < 0.8
		}

		status := orderStatuses[rand.Intn(len(orderStatuses))]

		order := FirebaseOrderData{
			Code:           orderCode,
			CustomerName:   randomName(),
			Phone:          randomPhone(),
			Email:          randomEmail(randomName()),
			Address:        fmt.Sprintf("%d Đường %s, Quận %d, TP.HCM", 100+rand.Intn(900), randomName(), 1+rand.Intn(12)),
			CustomerSource: customerSources[rand.Intn(len(customerSources))],
			OrderDate:      orderDate,
			DeliveryDate:   deliveryDate,
			CreatedBy:      createdBy,
			CreatedByName:  createdByName,
			CreatedAt:      orderDate,
			UpdatedAt:      orderDate + int64(rand.Intn(24*3600*1000)),
			Notes:          fmt.Sprintf("Ghi chú cho đơn hàng %s", orderCode),
			Discount:       discount,
			DiscountType:   discountType,
			ShippingFee:    shippingFee,
			Products:       products,
			Status:         status,
			TotalAmount:    totalAmount,
			DiscountAmount: discountAmount,
			Subtotal:       subtotal,
			Deposit:        deposit,
			DepositType:    "percentage",
			DepositAmount:  depositAmount,
			IsDepositPaid:  isDepositPaid,
		}

		if rand.Float32() < 0.5 {
			consultantID := salesMemberIDs[rand.Intn(len(salesMemberIDs))]
			order.ConsultantID = consultantID
			order.ConsultantName = data.Xoxo.Members[consultantID].Name
		}

		data.Xoxo.Orders[orderID] = order
	}

	// Generate Warranty Claims (linked to orders)
	data.Xoxo.WarrantyClaims = make(map[string]WarrantyClaim)
	warrantyOrderIDs := make([]string, 0)
	if len(orderCodes) > 0 {
		numWarrantyClaims := config.NumWarrantyClaims
		if numWarrantyClaims > len(orderCodes) {
			numWarrantyClaims = len(orderCodes)
		}
		selectedOrderIndices := rand.Perm(len(orderCodes))[:numWarrantyClaims]

		for i, orderIdx := range selectedOrderIndices {
			orderID := fmt.Sprintf("ORD_%03d", orderIdx+1)
			orderCode := orderCodes[orderIdx]
			order := data.Xoxo.Orders[orderID]

			warrantyID := fmt.Sprintf("WC_%03d", i+1)
			warrantyCode := generateWarrantyCode(i)

			// Copy products from order
			warrantyProducts := make(map[string]FirebaseProductData)
			for productID, product := range order.Products {
				warrantyProducts[productID] = product
			}

			warrantyClaim := WarrantyClaim{
				ID:                warrantyID,
				Code:              warrantyCode,
				OriginalOrderID:   orderID,
				OriginalOrderCode: orderCode,
				CustomerName:      order.CustomerName,
				Phone:             order.Phone,
				Email:             order.Email,
				Address:           order.Address,
				CustomerSource:    order.CustomerSource,
				OrderDate:         order.OrderDate,
				DeliveryDate:      order.DeliveryDate,
				CreatedBy:         order.CreatedBy,
				CreatedByName:     order.CreatedByName,
				Products:          warrantyProducts,
				Status:            warrantyStatuses[rand.Intn(len(warrantyStatuses))],
				TotalAmount:       order.TotalAmount,
				Notes:             fmt.Sprintf("Khiếu nại cho đơn hàng %s", orderCode),
				Issues:            []string{"Lỗi sản phẩm", "Không đúng mẫu"},
				CreatedAt:         order.OrderDate + int64(rand.Intn(7*24*3600*1000)),
				UpdatedAt:         order.OrderDate + int64(rand.Intn(10*24*3600*1000)),
			}

			data.Xoxo.WarrantyClaims[warrantyID] = warrantyClaim
			warrantyOrderIDs = append(warrantyOrderIDs, orderID)
		}
	}

	// Generate Inventory Transactions (linked to materials)
	data.Xoxo.InventoryTransactions = make(map[string]InventoryTransaction)
	materialIDs := make([]string, 0)
	for materialID := range data.Xoxo.Materials {
		materialIDs = append(materialIDs, materialID)
	}

	for i := 0; i < config.NumInventoryTxns && i < len(materialIDs)*2; i++ {
		materialID := materialIDs[rand.Intn(len(materialIDs))]
		material := data.Xoxo.Materials[materialID]

		txnCode := generateTransactionCode(i)
		txnType := "import"
		if rand.Float32() < 0.4 {
			txnType = "export"
		}

		quantity := 10 + rand.Intn(100)
		if txnType == "export" && quantity > material.StockQuantity {
			quantity = material.StockQuantity / 2
		}

		price := material.ImportPrice
		if price == 0 {
			price = 10000 + rand.Intn(100000)
		}
		totalAmount := quantity * price

		date := time.Now().AddDate(0, 0, -rand.Intn(30))
		txn := InventoryTransaction{
			Code:         txnCode,
			MaterialID:   materialID,
			MaterialName: material.Name,
			Type:         txnType,
			Quantity:     quantity,
			Unit:         material.Unit,
			Price:        price,
			TotalAmount:  totalAmount,
			Date:         date.Format("2006-01-02"),
			Supplier:     material.Supplier,
			Reason:       "",
			Note:         fmt.Sprintf("Giao dịch %s cho %s", txnType, material.Name),
			CreatedAt:    date.Unix() * 1000,
		}

		if txnType == "export" {
			reasons := []string{"Sản xuất", "Bán hàng", "Kiểm tra", "Hư hỏng"}
			txn.Reason = reasons[rand.Intn(len(reasons))]
		}

		data.Xoxo.InventoryTransactions[txnCode] = txn
	}

	// Generate Finance Transactions (linked to orders, inventory, refunds)
	data.Xoxo.FinanceTransactions = make(map[string]FinanceTransaction)
	financeIndex := 0

	// Finance transactions from orders
	for orderID, order := range data.Xoxo.Orders {
		if order.Status == "confirmed" || order.Status == "completed" {
			financeCode := generateFinanceCode(financeIndex)
			financeIndex++

			amount := order.DepositAmount
			if order.Status == "completed" {
				amount = order.TotalAmount - order.DepositAmount
			}

			financeTxn := FinanceTransaction{
				ID:          financeCode,
				Date:        order.OrderDate,
				Type:        "income",
				Category:    "order",
				Amount:      amount,
				Description: fmt.Sprintf("Đơn hàng %s", order.Code),
				Reference:   order.Code,
				SourceID:    orderID,
				SourceType:  "order",
				CreatedAt:   order.OrderDate,
				UpdatedAt:   order.UpdatedAt,
			}
			data.Xoxo.FinanceTransactions[financeCode] = financeTxn
		}
	}

	// Finance transactions from inventory imports
	for txnCode, txn := range data.Xoxo.InventoryTransactions {
		if txn.Type == "import" && financeIndex < config.NumFinanceTxns {
			financeCode := generateFinanceCode(financeIndex)
			financeIndex++

			financeTxn := FinanceTransaction{
				ID:          financeCode,
				Date:        txn.CreatedAt,
				Type:        "expense",
				Category:    "inventory",
				Amount:      txn.TotalAmount,
				Description: fmt.Sprintf("Nhập kho %s", txn.MaterialName),
				Reference:   txnCode,
				SourceID:    txn.MaterialID,
				SourceType:  "inventory",
				CreatedAt:   txn.CreatedAt,
				UpdatedAt:   txn.CreatedAt,
			}
			data.Xoxo.FinanceTransactions[financeCode] = financeTxn
		}
	}

	// Generate Refunds (linked to orders)
	data.Xoxo.Refunds = make(map[string]RefundRequest)
	refundOrderIDs := make([]string, 0)
	if len(orderCodes) > 0 {
		numRefunds := config.NumRefunds
		if numRefunds > len(orderCodes) {
			numRefunds = len(orderCodes)
		}
		selectedRefundIndices := rand.Perm(len(orderCodes))[:numRefunds]

		for i, orderIdx := range selectedRefundIndices {
			orderID := fmt.Sprintf("ORD_%03d", orderIdx+1)
			orderCode := orderCodes[orderIdx]
			order := data.Xoxo.Orders[orderID]

			refundID := fmt.Sprintf("RF_%03d", i+1)
			refundCode := generateRefundCode(i)

			refundAmount := order.TotalAmount / 2
			if order.DepositAmount > 0 {
				refundAmount = order.DepositAmount
			}

			refundType := refundTypes[rand.Intn(len(refundTypes))]
			refundStatus := refundStatuses[rand.Intn(len(refundStatuses))]
			requestedAt := order.OrderDate + int64(rand.Intn(7*24*3600*1000))
			updatedAt := requestedAt + int64(rand.Intn(3*24*3600*1000))

			refund := RefundRequest{
				ID:              refundID,
				OrderID:         orderID,
				OrderCode:       orderCode,
				Amount:          refundAmount,
				Reason:          "Khách hàng yêu cầu hoàn tiền",
				Type:            refundType,
				Status:          refundStatus,
				RequestedBy:     order.CreatedBy,
				RequestedByName: order.CreatedByName,
				RequestedAt:     requestedAt,
				CreatedAt:       requestedAt,
				UpdatedAt:       updatedAt,
				Notes:           fmt.Sprintf("Ghi chú cho yêu cầu hoàn tiền %s", refundCode),
			}

			adminMembers := make([]string, 0)
			for id, member := range data.Xoxo.Members {
				if member.Role == "admin" {
					adminMembers = append(adminMembers, id)
				}
			}

			if refundStatus == "approved" || refundStatus == "processed" {
				if len(adminMembers) > 0 {
					approvedBy := adminMembers[rand.Intn(len(adminMembers))]
					refund.ApprovedBy = approvedBy
					refund.ApprovedByName = data.Xoxo.Members[approvedBy].Name
					refund.ApprovedAt = requestedAt + int64(rand.Intn(2*24*3600*1000))
				}
			}

			if refundStatus == "rejected" {
				if len(adminMembers) > 0 {
					rejectedBy := adminMembers[rand.Intn(len(adminMembers))]
					refund.RejectedBy = rejectedBy
					refund.RejectedByName = data.Xoxo.Members[rejectedBy].Name
					refund.RejectedAt = requestedAt + int64(rand.Intn(2*24*3600*1000))
					refund.RejectionReason = "Không đủ điều kiện hoàn tiền"
				}
			}

			if refundStatus == "processed" {
				if len(adminMembers) > 0 {
					processedBy := adminMembers[rand.Intn(len(adminMembers))]
					refund.ProcessedBy = processedBy
					refund.ProcessedByName = data.Xoxo.Members[processedBy].Name
					refund.ProcessedDate = updatedAt
				}
			}

			data.Xoxo.Refunds[refundID] = refund
			refundOrderIDs = append(refundOrderIDs, orderID)

			// Add finance transaction for processed refunds
			if refund.Status == "processed" && financeIndex < config.NumFinanceTxns {
				financeCode := generateFinanceCode(financeIndex)
				financeIndex++

				financeTxn := FinanceTransaction{
					ID:          financeCode,
					Date:        refund.UpdatedAt,
					Type:        "expense",
					Category:    "order",
					Amount:      refund.Amount,
					Description: fmt.Sprintf("Hoàn tiền đơn hàng %s", orderCode),
					Reference:   refundCode,
					SourceID:    refundID,
					SourceType:  "refund",
					CreatedAt:   refund.UpdatedAt,
					UpdatedAt:   refund.UpdatedAt,
				}
				data.Xoxo.FinanceTransactions[financeCode] = financeTxn
			}
		}
	}

	// Generate Feedbacks (linked to orders)
	data.Xoxo.Feedbacks = make(map[string]CustomerFeedback)
	if len(orderCodes) > 0 {
		numFeedbacks := config.NumFeedbacks
		if numFeedbacks > len(orderCodes) {
			numFeedbacks = len(orderCodes)
		}
		selectedFeedbackIndices := rand.Perm(len(orderCodes))[:numFeedbacks]

		for i, orderIdx := range selectedFeedbackIndices {
			orderID := fmt.Sprintf("ORD_%03d", orderIdx+1)
			orderCode := orderCodes[orderIdx]
			order := data.Xoxo.Orders[orderID]

			feedbackID := fmt.Sprintf("FB_%03d", i+1)
			feedbackType := feedbackTypes[rand.Intn(len(feedbackTypes))]
			rating := 3 + rand.Intn(3)
			if feedbackType == "Chê" || feedbackType == "Bức xúc" {
				rating = 1 + rand.Intn(2)
			}

			feedback := CustomerFeedback{
				ID:              feedbackID,
				OrderID:         orderID,
				OrderCode:       orderCode,
				CustomerName:    order.CustomerName,
				CustomerPhone:   order.Phone,
				FeedbackType:    feedbackType,
				Rating:          rating,
				Notes:           fmt.Sprintf("Feedback cho đơn hàng %s", orderCode),
				CollectedBy:     order.CreatedBy,
				CollectedByName: order.CreatedByName,
				CollectedAt:     order.DeliveryDate + int64(rand.Intn(3*24*3600*1000)),
				CreatedAt:       order.DeliveryDate + int64(rand.Intn(3*24*3600*1000)),
				UpdatedAt:       order.DeliveryDate + int64(rand.Intn(3*24*3600*1000)),
			}

			data.Xoxo.Feedbacks[feedbackID] = feedback
		}
	}

	return data
}

func main() {
	config := defaultConfig

	// Allow config override via environment variables or command line args
	// For now, use default config
	data := generateMockData(config)

	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error marshaling JSON: %v\n", err)
		os.Exit(1)
	}

	outputFile := "./mock-data.json"
	if len(os.Args) > 1 {
		outputFile = os.Args[1]
	}

	err = os.WriteFile(outputFile, jsonData, 0644)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error writing file: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Mock data generated successfully! Written to %s\n", outputFile)
	fmt.Printf("Generated:\n")
	fmt.Printf("  - %d departments\n", len(data.Xoxo.Departments))
	fmt.Printf("  - %d members\n", len(data.Xoxo.Members))
	fmt.Printf("  - %d workflows\n", len(data.Xoxo.Workflows))
	fmt.Printf("  - %d categories\n", len(data.Xoxo.Categories))
	fmt.Printf("  - %d materials\n", len(data.Xoxo.Materials))
	fmt.Printf("  - %d orders\n", len(data.Xoxo.Orders))
	fmt.Printf("  - %d warranty claims\n", len(data.Xoxo.WarrantyClaims))
	fmt.Printf("  - %d inventory transactions\n", len(data.Xoxo.InventoryTransactions))
	fmt.Printf("  - %d finance transactions\n", len(data.Xoxo.FinanceTransactions))
	fmt.Printf("  - %d refunds\n", len(data.Xoxo.Refunds))
	fmt.Printf("  - %d feedbacks\n", len(data.Xoxo.Feedbacks))
}
