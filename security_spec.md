# Security Specification (Firestore Security TDD)

## 1. Data Invariants
1. **Administrative Integrity**: Under no circumstances can a user without a pre-authenticated role alter dealership configuration parameters, prices, or fleet settings.
2. **PII and Ledger Privacy**: Customers can ONLY query or retrieve service appointments or orders that explicitly contain their own matching `customerId` or verified authenticated `email`.
3. **Immutability of History**: Historical order records cannot be altered by regular users. ONLY administrative staff or backend triggers can transition statuses.
4. **Strict Temporal Integrity**: Handled variables such as application date or creation slot cannot use arbitrary client strings; they are guarded by validation parameters.

---

## 2. The "Dirty Dozen" Malicious Payloads

### Payload 1: Unauthorized Global Configuration Hijack (Write directly to /dealerSettings/default)
```json
{
  "phone": "555-EXPLOIT",
  "address": "112-14 Atlantic Ave, Richmond Hill, NY 11418",
  "weekdayHours": "Always Closed",
  "saturdayHours": "Always Closed",
  "promoBanner": "HAZZARDS HERE"
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 2: Price Alteration on In-Stock Commercial Truck
```json
{
  "id": "SSA01318",
  "name": "Isuzu NQR Box Truck",
  "category": "Box Truck",
  "condition": "New",
  "year": 2026,
  "make": "Isuzu",
  "model": "NQR",
  "price": 10.00,
  "imageUrl": "/stolen/url.png"
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 3: Injecting 10MB Junk ID to Deserializer
```json
{
  "id": "JUNK_CHARACTER_REPEATED_TEN_MILLION_TIMES_..."
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 4: Overwriting Other Customer's Account Record
```json
{
  "name": "Stolen Identity",
  "email": "victim@company.com",
  "phone": "911",
  "password": "stolen_password"
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 5: Siphoning Order Ledger Files (Read-List attack on orders)
```json
// Query containing no constraint where customerId != attackerId
Db.collection('orders').get()
```
*Expected Result: PERMISSION_DENIED*

### Payload 6: Anonymous Service Booking Insertion without proper Schema Attributes
```json
{
  "customerName": "Hacker",
  "vehicleClass": "heavy"
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 7: Fake Inbound CRM Lead Injection bypassing Format String regex
```json
{
  "name": "Malicious Script Name",
  "email": "invalid-email-address",
  "source": "Custom Build",
  "status": "New",
  "date": "Not a Date"
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 8: Careers Applicant Purge Attack (Anonymous Delete on careers)
```json
Db.collection('careers').doc('cand-1').delete()
```
*Expected Result: PERMISSION_DENIED*

### Payload 9: Self-Promoted Admin (Writing an authenticating file inside /admins/attackerId)
```json
{
  "role": "Super Admin"
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 10: State Shortcut Transition (Bypassing dispatch steps to clear an order)
```json
{
  "status": "Dispatched & Completed"
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 11: Spoofed Email Domain Account Auth Validation Bypass
```json
{
  "email": "SAMEERK0723@gmail.com",
  "name": "Spoofed Owner"
}
// with email_verified == false or auth.uid != ownerUid
```
*Expected Result: PERMISSION_DENIED*

### Payload 12: Injecting Null/Empty Strings on Mandatory Parts Inventory SKU Parameters
```json
{
  "sku": "",
  "name": "Improper Fluid Unit",
  "category": "Filters & Fluids",
  "price": 10.00,
  "brand": "Incomplete Brand",
  "stock": 0
}
```
*Expected Result: PERMISSION_DENIED*
