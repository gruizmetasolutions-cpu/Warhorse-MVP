Within the **Warhorse application workflow**, the system is structured around **three primary user profiles** that manage different stages of operations, alongside an auxiliary **operator role** that initiates the entire operational and maintenance cycle 1, 2\.  
The roles and their interactions in the workflow are organized as follows:

### 1\. The Core User Profiles

* **Administración (Administration / Management):** This profile has **complete visibility over the system** and exclusive access to the main **Dashboard** 1\. The primary responsibility of administration is to **monitor and oversee** the overall flow of work across all areas 1\. This profile is also the key consumer of the **four main system reports**: inventory, purchases, unit health, and inspections 3\.  
* **Taller (Workshop / Maintenance):** This profile is responsible for **generating and managing technical maintenance tasks** 1\. They receive automatic notifications when vehicle inspections flag operational issues, which they review to determine if a **Work Order (Orden de Trabajo)** is necessary 4\. The workshop team manages two types of work orders—**corrective** (triggered by inspections) and **preventive** (used to replenish stock without requiring immediate unit repairs) 5, 6—and updates the status of repairs (such as *en proceso*, *liberada*, or *liberada parcial*) 7\.  
* **Compras (Purchasing):** This profile **manages the acquisition of parts and exercises absolute control over the inventory** 1, 6\. Compras handles three types of inventory categories: general stock, specialized "Yonke" inventory (salvaged parts linked to specific units), and external purchases 8\. Their workspace transforms the purchasing process into a **virtual shopping cart experience**, allowing them to select parts from pre-registered or newly created suppliers 8\. They also track miscellaneous, non-workshop expenses through a **petty-cash-style (Caja Chica)** reporting process 9\.

### 2\. The Auxiliary Role: Operadores (Drivers / Operators)

While not listed as one of the three backend system profiles, **drivers** are the catalyst for the entire workflow 2\. Upon leaving or arriving at the yard, they use a tablet to log in via a **QR code or employee ID number** 2\. They complete a quick **inspection questionnaire** linked to their specific vehicle unit 2\. If they record any issues, the system automatically triggers an alert for the Workshop (*Taller*) profile 4\.

### 3\. How the Profiles Interact in the Application Workflow

The entire operational reclassification relies on a strict, sequential dependency between these roles:

1. **Initiation:** An **Operator** submits an inspection report 2\.  
2. **Evaluation:** The **Workshop** team reviews inspection alerts and determines whether to open a corrective Work Order 4\. Alternatively, they can generate preventive Work Orders to manage general fleet health 5\.  
3. **Procurement:** A **Work Order is a mandatory prerequisite** for any purchasing activity; a purchase requisition cannot exist without an open Work Order 4, 5\. Once generated, the **Purchasing** profile steps in to fulfill the requested parts, selecting from stock or placing external orders with suppliers 3, 8\.  
4. **Oversight:** The **Administration** profile supervises this entire lifecycle, utilizing the Dashboard and analytical reports to ensure logistical efficiency and track fleet health 1, 3\.

🎨 Would you like me to design a visual flowchart or an infographic outlining this workflow to show exactly how these profiles interact step-by-step?  

