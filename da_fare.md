# 🚀 Da Fare per Pubblicare le Analytics

Quando sei pronto per mandare online il sistema di tracciamento e la dashboard, esegui in ordine questi 4 comandi nel terminale:

1. **Imposta la password segreta per accedere alla dashboard:**
   *(Sostituisci "la_tua_password_segreta" con la password che preferisci usare)*
   ```bash
   npx supabase secrets set ANALYTICS_PASSWORD=la_tua_password_segreta
   ```

2. **Aggiorna il database online con la nuova tabella:**
   ```bash
   npx supabase db push
   ```

3. **Carica la funzione che traccia le visite in background:**
   ```bash
   npx supabase functions deploy track
   ```

4. **Carica la funzione che manda i dati alla dashboard:**
   ```bash
   npx supabase functions deploy analytics
   ```

*(Opzionale)* Ricordati anche di fare il **push o deploy del sito frontend (Vercel)** per aggiornare il codice del sito e far partire il tracciamento vero e proprio!
