param (
    [bool]$RegenerateWallets = $false
)

# Funzione per aprire un terminale e eseguire un comando
function Open-Terminal {
    param ($Command)
    # Usa Windows Terminal (wt) se disponibile, altrimenti cmd
    if (Get-Command wt -ErrorAction SilentlyContinue) {
        Start-Process wt -ArgumentList "-w 0 nt cmd /c `"$Command && pause`"" -NoNewWindow
    } else {
        Start-Process cmd -ArgumentList "/c $Command && pause" -NoNewWindow
    }
}

# t1: Generazione wallet (opzionale)
if ($RegenerateWallets) {
    Open-Terminal "cd blockchain_folder\scripts && node wallet_generator.js && move ..\address_data\wallets.json ..\address_data\wallet.json"
}

# t2: Esegui Hardhat node
Open-Terminal "cd blockchain_folder && npx hardhat node"

# Aspetta per assicurarsi che il node sia avviato
Start-Sleep -Seconds 5

# t3: Esegui deploy.js
Open-Terminal "cd blockchain_folder && npx hardhat run scripts\deploy.js --network localhost"

# Aspetta che il deploy sia completato
Start-Sleep -Seconds 5

# t4: Avvia backend
Open-Terminal "cd backend && npm run dev"

# Aspetta che il backend sia avviato
Start-Sleep -Seconds 5

# t5: Avvia frontend
Open-Terminal "cd frontend && npm run dev"

Write-Output "Tutti i terminali sono stati avviati!"