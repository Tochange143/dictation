!macro customInstall
  DetailPrint "Configuring application permissions for Windows Sandbox..."
  nsExec::Exec 'icacls "$INSTDIR" /grant *S-1-15-2-1:(OI)(CI)(RX) /T'
!macroend
