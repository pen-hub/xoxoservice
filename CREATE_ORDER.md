You will create a **Next.js** page named **CreateOrderPage**.

## Technology Requirements

- Use **Next.js App Router**
- Use **Ant Design** components exclusively (Form, Input, Select, Table, Steps,
  Button, Layout)
- Use **TailwindCSS v5** for layout and spacing classes
- **Do NOT use inline style** anywhere
- Data must come from a mocked JSON structure (no backend)
- Folder structure must follow: `app/orders/create/page.tsx`

---

## UI Layout Requirements

### Page Structure

- Use Ant Design `<Layout>`:
  - `<Layout.Header>`: show page title "Create Order"
  - `<Layout.Content>`: contains form and product configurator

### Breadcrumb

- Add Ant Design `<Breadcrumb>`
- Read breadcrumb data from a config array:
  ```ts
  const breadcrumb = [
    { path: "/orders", title: "Orders" },
    { path: "/orders/create", title: "Create Order" },
  ];
  ```

* Render it dynamically

---

## Form Requirements

Use AntD `<Form>` with vertical layout.

Fields:

1. **Order Code**

   - Component: `<Input />`
   - Required

2. **Customer Name**

   - `<Input />`
   - Required

3. **Created By (Staff)**

   - `<Select />`
   - Options loaded from mocked staff JSON:

     ```json
     {
       "xoxo": {
         "staff": {
           "s1": { "name": "Alice", "role": "sale" },
           "s2": { "name": "Bob", "role": "manager" },
           "s3": { "name": "Mai", "role": "worker" }
         }
       }
     }
     ```

4. **Products Table**

   - User can add many products
   - Each product includes:

     - productName (string)
     - quantity (number)
     - A list of stages that belong to this product

---

## Stage Selector Requirements

Each product contains multiple stages.

Stage data from mocked JSON:

```json
{
  "xoxo": {
    "stages": {
      "st1": { "stageName": "Cutting" },
      "st2": { "stageName": "Sewing" },
      "st3": { "stageName": "Packaging" }
    }
  }
}
```

### For each stage:

- Show an AntD `<Card>`
- Inside card:

  - Stage Name
  - Staff Assignment: `<Select mode="multiple" />` Options: list of staff
  - Status selector: `<Select />` with:

    - pending
    - in_progress
    - completed

---

## Product Component Requirements

Build a reusable component: `<ProductCard />` containing:

- Product info fields
- Stage list
- Button: “Add Stage”
- Button: “Remove Product”

Use AntD `<Card>` + Tailwind for layout.

---

## Data Output

When user submits:

- Construct JSON in this format:

```json
{
  "orderId": "auto-generated",
  "code": "string",
  "customerName": "string",
  "createdBy": "staffId",
  "createdAt": 1733392000000,
  "products": {
    "{productId}": {
      "name": "string",
      "quantity": 10,
      "stages": {
        "{stageId}": {
          "workflowId": "stageId",
          "name": "Stage Name",
          "employees": ["staffId1", "staffId2"],
          "status": "pending",
          "completedQuantity": 0,
          "updatedAt": 1733392000000
        }
      }
    }
  }
}
```

---

## Additional Rules

- All UI must use Ant Design components
- Layout and spacing must use Tailwind utility classes
- Absolutely avoid inline styles
- Code must be clean, typed with TypeScript
- Create helper hooks or utils if necessary

---

Generate the entire page as a complete working file in TypeScript.
