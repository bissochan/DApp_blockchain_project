#!/bin/bash

# Flag per controllare se rigenerare i wallet (default: no)
REGENERATE_WALLETS=${1:-false}

# Funzione per aprire un terminale e eseguire un comando
open_terminal() {
    local cmd=$1
    # Utilizza gnome-terminal (o altro terminale a seconda del sistema)
    gnome-terminal -- bash -c "$cmd; exec bash" &
}

# t1: Generazione wallet (opzionale)
if [ "$REGENERATE_WALLETS" = "true" ]; then
    open_terminal "cd blockchain_folder/scripts && node wallet_generator.js && mv ../address_data/wallets.json ../address_data/wallet.json"
fi

# t2: Esegui Hardhat node
open_terminal "cd blockchain_folder && npx hardhat node"

# Aspetta un po' per assicurarsi che il node sia avviato
sleep 1

# t3: Esegui deploy.js
open_terminal "cd blockchain_folder && npx hardhat run ./scripts/deploy.js --network localhost"

# Aspetta che il deploy sia completato
sleep 5

# t4: Avvia backend
open_terminal "cd backend && npm run dev"

# Aspetta che il backend sia avviato
sleep 1

# t5: Avvia frontend
open_terminal "cd frontend && npm run dev"

echo "DApp ready to use!"