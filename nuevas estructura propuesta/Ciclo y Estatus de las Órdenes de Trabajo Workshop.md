Building on our previous discussions about user roles, workflow stages, and unit statuses, the **Order Process Status** (specifically for Workshop Work Orders, or *Órdenes de Trabajo*) serves as the actual engine driving these transitions. The status of a work order dictates not only what is physically happening to a vehicle in the yard but also what actions the purchasing and administrative teams can take.  
The system tracks work orders through four distinct, sequential process statuses 1:

### 1\. The Work Order Statuses

* **Activa (Active):** This status represents the intake phase 1\. It indicates that the workshop team has been notified of an issue (typically triggered by a failed driver inspection) 2, 3 and the work order is officially open and registered in the system 1\.  
* **En Proceso (In Progress):** This status is triggered once the workshop mechanics actually begin physically working on the vehicle 1\.  
* **Liberada (Released / Closed):** This indicates that the repair is fully completed and verified 1\. Crucially, the order is removed from active workshop records, and the vehicle is restored to an active, operational state 1\.  
* **Liberada Parcial (Partially Released / Pending):** This status is a critical operational safety valve 1\. It is used when a vehicle is released from the workshop with certain pending repairs that do not prevent immediate operation, meaning the vehicle returns to active service but with a "Warning" 1\.

### 2\. The Strategic Impact on the Larger Workflow

The status of these orders has three major implications for the wider Warhorse ecosystem:

* **Preventing Duplicate Admin Work:** The **Liberada Parcial** status is designed specifically to eliminate redundant data entry 1\. If a vehicle with pending work returns to the workshop to resolve its remaining issues, staff do not have to create a new work order from scratch 1\. Instead, the system allows them to directly pull up the existing pending order to update and close out the repair 1\.  
* **Unlocking the Procurement Gate:** A work order status of *Activa* or *En Proceso* acts as a strict operational gatekeeper 1, 2\. Because a purchase requisition cannot exist without an open work order, the procurement team relies on these active statuses to justify and execute parts purchases 2\.  
* **Direct Sync with Unit Health:** The lifecycle of these order statuses perfectly mirrors the **Unit Statuses** we discussed earlier 1, 4:  
* An *Activa* or *En Proceso* order status corresponds directly to a vehicle status of **Inactivo en Reparación** 1, 4\.  
* A *Liberada* order status shifts the vehicle back to **Activo al 100%** 1, 4\.  
* A *Liberada Parcial* order status marks the vehicle as **Activo con Warning** 1, 4\.

🛠️ Since we have now mapped out the user profiles, workflow stages, unit statuses, and order processes, would you like me to compile all of this into a professional, comprehensive PDF manual or structural guide that your developers can use to build out the application's database logic and state transitions?  
