!macro NSIS_HOOK_POSTINSTALL
  ; Habilitar el registro operativo de impresión para capturar Event 307.
  ; El instalador corre con elevación, por lo que este comando sí tiene permiso.
  ExecWait '"$SYSDIR\wevtutil.exe" sl Microsoft-Windows-PrintService/Operational /e:true' $0
!macroend
