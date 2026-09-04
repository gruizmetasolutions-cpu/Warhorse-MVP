In the Warhorse application workflow, **Unit Statuses** (estados de las unidades) represent the core operational health of the fleet 1\. These statuses are highly dynamic, transitioning based on driver-led inspections, workshop activities, and inventory decisions 1, 2\.  
According to the source, the system classifies unit health into the following five states:

1. **Activo al 100% (100% Active):** The unit is fully operational with no outstanding issues 1\.  
2. **Activo con Warning / varios Warnings (Active with Warning(s)):** The unit remains operational but carries one or more flagged issues stemming directly from inspections 1\.  
3. **Inactivo en Reparación (Inactive in Repair):** The unit is currently in the workshop 1\. While still registered as "active" in the database, it is "not available" for active duty 1\.  
4. **Inactivo \- Yonke (Inactive \- Salvage):** The unit is permanently removed from active service and classified as a salvage unit to be stripped for parts 1\.  
5. **Inactivo (Inactive / Decommissioned):** The unit is completely retired and deregistered—it cannot be used as active, repaired, or even used for salvage (*dado de baja*) 1, 2\.

### How Unit Statuses Drive the Application Workflow

The lifecycle of a vehicle through these states is tightly integrated into the rest of the Warhorse system:

* **Inspection-Driven Changes (Stage 1 to Status):** When operators log in via a tablet using a QR code or employee ID to submit their inspection questionnaire, their inputs directly dictate if a unit's status drops from *Activo al 100%* to *Activo con Warning* 1, 3\. Any logged issue automatically triggers an alert to the Workshop (*Taller*) 4\.  
* **Workshop & Work Order Interaction (Stage 2 to Status):** When a vehicle is checked into the workshop and registered under an active Work Order, its status transitions to *Inactivo en Reparación* 1, 4\. The progression and resolution of that Work Order directly resolve the vehicle's status 2:  
* **Liberada (Released):** The repair is fully completed and removed from workshop records, restoring the unit to an *Activo* state 2\.  
* **Liberada Parcial (Partially Released):** If the unit is released with pending repairs, the work order status remains "pending" 2\. The vehicle returns to service but is marked *Activo con Warning* 1, 2\. When the unit returns to resolve the remaining issues, the workshop can directly pull up the pending order from the system instead of creating a new one 2\.  
* **The Salvage Cycle & Inventory (Stage 3 to Status):** When a unit's health deteriorates beyond repair and it transitions to *Inactivo \- Yonke*, it shifts from a physical asset to an inventory source 1, 5\. The Purchasing (*Compras*) profile manages this specialized "Yonke" inventory, where salvaged parts are carefully cataloged with a specific tag linking them directly back to the unique unit ID from which they were recovered 5\.  
* **Administrative Oversight (Stage 4):** These real-time status transitions feed directly into the main **Unit Health / Unit Status Report** (*reporte de salud de las unidades*) 1, 6\. The Administration profile uses this report alongside the Dashboard to oversee fleet availability, audit workshop efficiency, and maintain full transparency 6, 7\.

⚙️ Would you like me to generate a visual mind map illustrating how a vehicle moves between these active, warning, workshop, and decommissioned statuses to help you map out the state-machine logic for your developers?  

