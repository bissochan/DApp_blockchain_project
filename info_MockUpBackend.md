# Campi JSON per richieste e risposte backend

---

### POST /api/post_exp

**Input JSON:**

```json
{
  "company": "string",         // nome azienda (obbligatorio)
  "role": "string",            // ruolo lavorativo (obbligatorio)
  "startDate": "string",       // data inizio (obbligatorio, es. "YYYY-MM-DD")
  "endDate": "string",         // data fine (opzionale, può essere stringa vuota)
  "description": "string"      // descrizione (opzionale)
}
```

**Output JSON (201 Created):**

```json
{
  "id": "number",              // ID generato per esperienza
  "company": "string",
  "role": "string",
  "startDate": "string",
  "endDate": "string",
  "description": "string",
  "hash": "string"             // hash fittizio generato (es. "0x...")
}
```

---

### GET /api/get_all_exp

**Output JSON (200 OK):**

```json
[
  {
    "id": "number",
    "company": "string",
    "role": "string",
    "startDate": "string",
    "endDate": "string",
    "description": "string",
    "hash": "string"
  },
  ...
]
```

---

### GET /api/get_all_request_exp

**Output JSON (200 OK):**

```json
[
  {
    "id": "number",
    "company": "string",
    "role": "string",
    "startDate": "string",
    "endDate": "string"    // può essere vuoto
  },
  ...
]
```

---

### POST /api/post_exp_cert

**Input JSON:**

```json
{
  "id": "number",             // ID richiesta di certificazione da approvare/rifiutare
  "isApproved": "boolean"     // true = approvata, false = rifiutata
}
```

**Output JSON (200 OK):**

```json
{
  "success": true
}
```

---

### POST /api/check

**Input JSON:**

```json
{
  "hash": "string"            // hash del certificato da verificare (es. "0xabcdef1234...")
}
```

**Output JSON (200 OK):**

- Se valido:

```json
{
  "valid": true,
  "company": "string",
  "role": "string",
  "startDate": "string",
  "endDate": "string"
}
```

- Se non valido:

```json
{
  "valid": false
}
```

---

### Errori comuni

**Formato JSON (esempio 400, 404, 500):**

```json
{
  "error": "string"           // messaggio di errore descrittivo
}
```
