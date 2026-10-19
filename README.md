# Portale Rotto

Gioco idle per il browser, da giocare sul telefono (iPhone o Android) senza passare dagli store.

- **Goku** combatte da solo zona dopo zona, con un boss ogni 10 stadi (e la Kamehameha automatica).
- **Rick** apre i portali e nel suo laboratorio trasforma i rottami in potenziamenti.
- **Torcio** parte in e-bike nelle spedizioni attraverso i portali e torna con 5-10 oggetti, più casse bonus. Goku indossa da solo i pezzi migliori e il resto diventa rottami.
- **Progressi offline**: quando riapri il gioco vedi cosa è successo mentre eri via (fino a 10 ore).
- **Difesa del Varco**: la parte che comandi tu. È un tower defense a 5 ondate con 3 tipi di torretta, e si gioca con 3 chiavi al giorno.

Gioco personale e non commerciale. Goku e Rick appartengono ai rispettivi autori.

## Giocare sul telefono

1. Pubblica il sito con GitHub Pages: su GitHub apri **Settings → Pages**, sotto "Build and deployment" scegli **Deploy from a branch**, poi il ramo `main` e la cartella `/ (root)`, e salva.
2. Dopo un minuto il gioco è su `https://dispensasmart.github.io/IDLE/`.
3. **iPhone**: aprilo in Safari, tocca Condividi e poi "Aggiungi alla schermata Home".
   **Android**: aprilo in Chrome, menu ⋮ e poi "Installa app".

Il salvataggio resta sul telefono. Nel menu **Altro** puoi copiare un codice di salvataggio per sicurezza.

## Sviluppo

È JavaScript semplice, senza dipendenze né passaggi di build.

```bash
npm start   # avvia un server locale su http://localhost:8000
npm test    # prova la logica di gioco (Node 20+)
```

- `js/logic/`: regole del gioco (battaglia, bottino, spedizioni, offline, Varco), senza grafica e coperte dai test
- `js/ui/`: disegni dei personaggi, schermate e interfaccia
- `sw.js` e `manifest.webmanifest`: rendono il gioco installabile e giocabile anche senza rete

Quando modifichi i file del gioco, aumenta la versione `CACHE` in `sw.js`, così i telefoni scaricano la nuova versione.
