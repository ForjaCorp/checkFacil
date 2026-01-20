#!/bin/bash

# 1. Get WSL IP
WSL_IP=$(hostname -I | awk '{print $1}')
PORT=5173

echo "📍 WSL IP detected: $WSL_IP"

# 2. Add Port Proxy Rule + Firewall Rule (Requires Admin - triggers UAC)
echo "🔒 Requesting Admin privileges to update Windows Port Forwarding and Firewall..."

# PowerShell command that:
# 1. Sets up the port proxy (Windows -> WSL)
# 2. Removes old firewall rules with the same name (to avoid duplicates)
# 3. Adds a new firewall rule allowing TCP traffic on the specific port
PS_COMMAND="netsh interface portproxy add v4tov4 listenport=$PORT listenaddress=0.0.0.0 connectport=$PORT connectaddress=$WSL_IP; Remove-NetFirewallRule -DisplayName 'CheckFacil Dev Server' -ErrorAction SilentlyContinue; New-NetFirewallRule -DisplayName 'CheckFacil Dev Server' -Direction Inbound -LocalPort $PORT -Protocol TCP -Action Allow; Write-Host '✅ Port Forwarding & Firewall Rule applied successfully!'; Write-Host 'You can close this window.';"

powershell.exe -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoExit', '-Command', \"$PS_COMMAND\""

# 3. Get Windows LAN IP to display to user
echo "🔎 Detecting Windows LAN IP..."
WIN_IP=$(powershell.exe -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { \$_.InterfaceAlias -notmatch 'vEthernet' -and \$_.InterfaceAlias -notmatch 'Loopback' -and \$_.IPAddress -notmatch '^169\.254' } | Select-Object -ExpandProperty IPAddress | Select-Object -First 1")

# Clean up whitespace
WIN_IP=$(echo $WIN_IP | tr -d '\r')

echo ""
echo "✅ SUCCESS! Network configured."
echo "📱 Open this URL on your mobile:"
echo "   http://$WIN_IP:$PORT"
echo ""
echo "👉 Make sure your phone is connected to the same Wi-Fi network as this PC."
