!macro NSIS_HOOK_POSTINSTALL
  ; Habilitar el registro operativo de impresión para capturar Event 307.
  ; El instalador corre con elevación, por lo que este comando sí tiene permiso.
  ; El evento 307 (documento impreso) usa keywords 0x4000000000000840, que no
  ; vienen activas al habilitar solo el log. Se activan todas las keywords
  ; habituales del spooler para no perder impresiones.
  ExecWait '"$SYSDIR\wevtutil.exe" sl Microsoft-Windows-PrintService/Operational /e:true /k:0x4004000000000FFF' $0

  ; El documento real vive en C:\Windows\System32\spool\PRINTERS y solo es
  ; legible con privilegios. Una tarea SYSTEM lo copia a ProgramData; el agente
  ; escribe el script al arrancar y convierte los .spl a PDF.
  CreateDirectory "C:\ProgramData\IMPULSA"
  CreateDirectory "C:\ProgramData\IMPULSA\spool"
  ; El agente (usuario normal) debe poder escribir capture_spool.ps1 en la raíz,
  ; por eso Both reciben Modify; la tarea SYSTEM solo lee los .spl copiados.
  ExecWait '"$SYSDIR\icacls.exe" "C:\ProgramData\IMPULSA" /grant *S-1-1-0:(OI)(CI)M /T' $1
  ExecWait '"$SYSDIR\icacls.exe" "C:\ProgramData\IMPULSA\spool" /grant *S-1-1-0:(OI)(CI)M /T' $2
  ExecWait '"$SYSDIR\schtasks.exe" /Create /TN "IMPULSA-SpoolCapture" /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -File $\"C:\ProgramData\IMPULSA\capture_spool.ps1$\"" /SC MINUTE /MO 1 /RL HIGHEST /RU SYSTEM /F' $3
  ExecWait '"$SYSDIR\schtasks.exe" /Run /TN "IMPULSA-SpoolCapture"' $4
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ExecWait '"$SYSDIR\schtasks.exe" /Delete /TN "IMPULSA-SpoolCapture" /F' $0
!macroend
