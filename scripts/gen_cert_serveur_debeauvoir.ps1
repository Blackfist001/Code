# Script PowerShell pour générer un certificat auto-signé avec SAN
$dnsName = "serveur.debeauvoir.local"
$certName = "ServeurDebeauvoirLocal"
$pfxPath = "C:\\temp\\$certName.pfx"
$pfxPassword = "test"

# Créer le certificat auto-signé avec SAN
$cert = New-SelfSignedCertificate -DnsName $dnsName -CertStoreLocation "cert:\\LocalMachine\\My" -FriendlyName $certName -NotAfter (Get-Date).AddYears(5) -KeyLength 2048

# Exporter le certificat au format PFX
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password (ConvertTo-SecureString -String $pfxPassword -Force -AsPlainText)

Write-Host "Certificat généré et exporté vers $pfxPath"
Write-Host "Mot de passe du PFX : $pfxPassword"
Write-Host "Tu peux maintenant l’importer dans IIS (Certificats de serveur > Importer...)"