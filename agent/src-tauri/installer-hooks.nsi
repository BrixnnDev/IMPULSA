!macro NSIS_HOOK_POSTINSTALL
  ; Habilitar el registro operativo de impresión para capturar Event 307.
  ; El instalador corre con elevación, por lo que este comando sí tiene permiso.
  ; El evento 307 (documento impreso) usa keywords 0x4000000000000840, que no
  ; vienen activas al habilitar solo el log. Se activan todas las keywords
  ; habituales del spooler para no perder impresiones.
  ExecWait '"$SYSDIR\wevtutil.exe" sl Microsoft-Windows-PrintService/Operational /e:true /k:0x4004000000000FFF' $0
!macroend
