use chrono::{DateTime, Local, LocalResult, Utc};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::net::UdpSocket;
use std::path::PathBuf;
use std::time::Duration;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
struct SavedState {
    server_url: String,
    pairing_code: String,
    pc_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct SystemInfo {
    computer_name: String,
    local_ip: String,
    mac_address: String,
    os_version: String,
}

#[derive(Debug, Deserialize)]
struct ScanConfig {
    carpeta: Option<String>,
    servidor: Option<String>,
    persona: Option<String>,
    solo_nuevos: Option<bool>,
}

const DEFAULT_SCAN_FOLDER: &str = "\\\\DESKTOP-P5G6A7L\\servidor";
const DEFAULT_API: &str = "https://impulsa-api-v1l0.onrender.com";

fn get_state_path(app: &tauri::AppHandle) -> PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    fs::create_dir_all(&dir).ok();
    dir.join("state.json")
}

fn get_local_ip_raw() -> String {
    let socket = UdpSocket::bind("0.0.0.0:0");
    if let Ok(s) = socket {
        if s.connect("8.8.8.8:80").is_ok() {
            if let Some(addr) = s.local_addr().ok() {
                return addr.ip().to_string();
            }
        }
    }
    "127.0.0.1".to_string()
}

fn get_mac_address_raw() -> String {
    use std::process::Command;
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let output = Command::new("getmac")
            .args(["/fo", "csv", "/nh"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        if let Ok(out) = output {
            let stdout = String::from_utf8_lossy(&out.stdout);
            for line in stdout.lines() {
                let parts: Vec<&str> = line.split(',').collect();
                if parts.len() >= 1 {
                    let mac = parts[0].trim_matches('"').trim();
                    if !mac.is_empty()
                        && mac != "Media State"
                        && !mac.contains("disconnected")
                    {
                        return mac.to_string();
                    }
                }
            }
            return "Not Found".to_string();
        }
    }
    "Not Found".to_string()
}

fn get_computer_name() -> String {
    hostname::get()
        .map(|h| h.to_string_lossy().to_string())
        .unwrap_or_else(|_| "Unknown".to_string())
}

fn get_os_version() -> String {
    let os = std::env::consts::OS;
    let ver = os_info::get();
    format!("{} {} ({})", os, ver.version(), ver.os_type())
}

#[tauri::command]
fn get_system_info() -> SystemInfo {
    SystemInfo {
        computer_name: get_computer_name(),
        local_ip: get_local_ip_raw(),
        mac_address: get_mac_address_raw(),
        os_version: get_os_version(),
    }
}

#[tauri::command]
fn get_local_ip() -> String {
    get_local_ip_raw()
}

#[tauri::command]
fn get_mac_address() -> String {
    get_mac_address_raw()
}

#[tauri::command]
fn save_state(
    app: tauri::AppHandle,
    server_url: String,
    pairing_code: String,
    pc_name: String,
) -> Result<(), String> {
    let state = SavedState {
        server_url,
        pairing_code,
        pc_name,
    };
    let path = get_state_path(&app);
    let json = serde_json::to_string_pretty(&state).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_state(app: tauri::AppHandle) -> Option<SavedState> {
    let path = get_state_path(&app);
    if !path.exists() {
        return None;
    }
    let data = fs::read_to_string(&path).ok()?;
    serde_json::from_str(&data).ok()
}

#[tauri::command]
fn clear_state(app: tauri::AppHandle) -> Result<(), String> {
    let path = get_state_path(&app);
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn get_scan_config_path() -> PathBuf {
    std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|d| d.join("config.json")))
        .unwrap_or_else(|| PathBuf::from("config.json"))
}

fn get_sent_path(base: &PathBuf) -> PathBuf {
    base.join("sent.json")
}

// Timestamp (UTC) de la medianoche local de hoy. Sirve para distinguir los
// escaneos de hoy de los archivos antiguos que ya estaban en la carpeta.
fn inicio_de_hoy() -> i64 {
    let ahora = Local::now();
    let medianoche = ahora
        .date_naive()
        .and_hms_opt(0, 0, 0)
        .unwrap_or_else(|| ahora.naive_local());
    match medianoche.and_local_timezone(Local) {
        LocalResult::Single(dt) => dt.timestamp(),
        _ => ahora.timestamp(),
    }
}

fn guardar_enviados(path: &PathBuf, enviados: &HashSet<String>) {
    if let Ok(json) = serde_json::to_string(&enviados.iter().collect::<Vec<_>>()) {
        let _ = fs::write(path, json);
    }
}

fn fecha_modificacion(path: &PathBuf) -> Option<DateTime<Utc>> {
    fs::metadata(path)
        .and_then(|m| m.modified())
        .ok()
        .map(DateTime::<Utc>::from)
}

fn load_scan_config() -> ScanConfig {
    fs::read_to_string(get_scan_config_path())
        .ok()
        .and_then(|s| serde_json::from_str::<ScanConfig>(&s).ok())
        .unwrap_or(ScanConfig {
            carpeta: None,
            servidor: None,
            persona: None,
            solo_nuevos: None,
        })
}

fn upload_scan_file(path: &PathBuf, persona: &str, api: &str, fecha: &str) -> bool {
    use std::process::Command;
    #[cfg(windows)]
    use std::os::windows::process::CommandExt;
    #[cfg(windows)]
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let mut cmd = Command::new("curl.exe");
    cmd.arg("-s")
        .arg("-X")
        .arg("POST")
        .arg("-F")
        .arg(format!("file=@{}", path.to_string_lossy()))
        .arg("-F")
        .arg(format!("persona={}", persona))
        .arg("-F")
        .arg(format!("fecha={}", fecha))
        .arg(format!("{}/api/scans/upload", api.trim_end_matches('/')));
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    match cmd.output() {
        Ok(out) => {
            out.status.success() && String::from_utf8_lossy(&out.stdout).contains("\"ok\":true")
        }
        Err(_) => false,
    }
}

// Sube automáticamente los archivos nuevos de la carpeta del escáner.
fn start_scan_watcher(storage_dir: PathBuf) {
    std::thread::spawn(move || {
        let cfg = load_scan_config();
        let solo_nuevos = cfg.solo_nuevos.unwrap_or(true);
        let folder = PathBuf::from(cfg.carpeta.as_deref().unwrap_or(DEFAULT_SCAN_FOLDER));
        let api = cfg.servidor.unwrap_or_else(|| DEFAULT_API.to_string());
        let persona = cfg.persona.unwrap_or_else(|| "Digitador".to_string());
        fs::create_dir_all(&storage_dir).ok();
        let sent_path = get_sent_path(&storage_dir);

        let mut sent: HashSet<String> = fs::read_to_string(&sent_path)
            .ok()
            .and_then(|s| serde_json::from_str::<Vec<String>>(&s).ok())
            .map(|v| v.into_iter().collect())
            .unwrap_or_default();

        // La carpeta compartida tiene archivos de muchos días. Solo se ignoran
        // los anteriores a hoy; los que se escanearon hoy se vuelven a evaluar
        // aunque el agente estuviera cerrado cuando se crearon. El backend
        // descarta duplicados por nombre + tamaño.
        if solo_nuevos && folder.is_dir() {
            let inicio = inicio_de_hoy();
            if let Ok(entries) = fs::read_dir(&folder) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if !path.is_file() {
                        continue;
                    }
                    let name = entry.file_name().to_string_lossy().to_string();
                    let es_de_hoy = fecha_modificacion(&path)
                        .map(|f| f.timestamp() >= inicio)
                        .unwrap_or(false);
                    if es_de_hoy {
                        sent.remove(&name);
                    } else {
                        sent.insert(name);
                    }
                }
                guardar_enviados(&sent_path, &sent);
            }
        }

        let mut sizes: HashMap<String, u64> = HashMap::new();

        loop {
            std::thread::sleep(Duration::from_secs(3));
            if !folder.is_dir() {
                continue;
            }
            let entries = match fs::read_dir(&folder) {
                Ok(e) => e,
                Err(_) => continue,
            };
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if name.starts_with('.') || sent.contains(&name) {
                    continue;
                }
                let path = entry.path();
                if !path.is_file() {
                    continue;
                }
                let size = match fs::metadata(&path) {
                    Ok(m) => m.len(),
                    Err(_) => continue,
                };
                if size == 0 {
                    continue;
                }
                // Espera a que el escáner termine de escribir el archivo.
                if sizes.get(&name) != Some(&size) {
                    sizes.insert(name.clone(), size);
                    continue;
                }
                let fecha = fecha_modificacion(&path)
                    .map(|f| f.to_rfc3339())
                    .unwrap_or_default();
                if upload_scan_file(&path, &persona, &api, &fecha) {
                    sent.insert(name.clone());
                    guardar_enviados(&sent_path, &sent);
                    println!("[escaner] subido: {}", name);
                }
            }
        }
    });
}

fn post_json(path: &str, payload: &str, api: &str) -> bool {
    use std::process::Command;
    #[cfg(windows)]
    use std::os::windows::process::CommandExt;
    #[cfg(windows)]
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let mut cmd = Command::new("curl.exe");
    cmd.arg("-s")
        .arg("-X")
        .arg("POST")
        .arg("-H")
        .arg("Content-Type: application/json")
        .arg("-d")
        .arg(payload)
        .arg(format!("{}{}", api.trim_end_matches('/'), path));
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
    matches!(cmd.output(), Ok(out) if out.status.success())
}

// Envía la impresión junto con el documento real capturado del spooler.
fn post_print_file(
    pc: &str,
    id: &str,
    documento: &str,
    usuario: &str,
    impresora: &str,
    paginas: i64,
    fecha: &str,
    archivo: &PathBuf,
    nombre: &str,
    mime: &str,
    api: &str,
) -> bool {
    use std::process::Command;
    #[cfg(windows)]
    use std::os::windows::process::CommandExt;
    #[cfg(windows)]
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let nombre = if nombre.is_empty() {
        archivo
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "documento.pdf".to_string())
    } else {
        nombre.to_string()
    };
    let mime = if mime.is_empty() {
        if nombre.to_lowercase().ends_with(".pdf") {
            "application/pdf"
        } else {
            "application/octet-stream"
        }
    } else {
        mime
    };

    let mut cmd = Command::new("curl.exe");
    cmd.arg("-s")
        .arg("-X")
        .arg("POST")
        .arg("-F")
        .arg(format!("pc={}", pc))
        .arg("-F")
        .arg(format!("evento_id={}", id))
        .arg("-F")
        .arg(format!("documento={}", documento))
        .arg("-F")
        .arg(format!("usuario={}", usuario))
        .arg("-F")
        .arg(format!("impresora={}", impresora))
        .arg("-F")
        .arg(format!("paginas={}", paginas))
        .arg("-F")
        .arg(format!("copias=1"))
        .arg("-F")
        .arg(format!("fecha={}", fecha))
        .arg("-F")
        .arg(format!(
            "file=@{};filename={};type={}",
            archivo.to_string_lossy(),
            nombre,
            mime
        ))
        .arg(format!("{}/api/pc/print", api.trim_end_matches('/')));
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
    matches!(cmd.output(), Ok(out) if out.status.success())
}

fn load_pairing(storage_dir: &PathBuf) -> (String, String) {
    let data = fs::read_to_string(storage_dir.join("state.json")).unwrap_or_default();
    let value: serde_json::Value = serde_json::from_str(&data).unwrap_or(serde_json::Value::Null);
    let pairing = value
        .get("pairing_code")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let name = value
        .get("pc_name")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    (pairing, name)
}

// Heartbeat del agente: solo se envía mientras el proceso esté vivo.
// Al cerrarse, el backend marca la PC offline en ~45 segundos.
fn start_heartbeat(storage_dir: PathBuf) {
    std::thread::spawn(move || {
        let api = load_scan_config()
            .servidor
            .unwrap_or_else(|| DEFAULT_API.to_string());
        loop {
            // El emparejamiento puede hacerse después de iniciar el agente.
            // Leer el estado dentro del bucle evita que el heartbeat muera al arrancar.
            let (pairing, name) = load_pairing(&storage_dir);
            let pc = if name.is_empty() { pairing.clone() } else { name.clone() };
            if pc.is_empty() {
                std::thread::sleep(Duration::from_secs(2));
                continue;
            }
            let payload = serde_json::json!({
                "pc": pc,
                "pc_name": name,
                "pairing_code": pairing,
                "ip": get_local_ip_raw(),
                "mac": get_mac_address_raw(),
                "sistema": get_os_version(),
                "ubicacion": "",
            })
            .to_string();
            post_json("/api/pc/heartbeat", &payload, &api);
            std::thread::sleep(Duration::from_secs(15));
        }
    });
}

// Script de PowerShell que lee las impresiones de Windows. Se escribe en el
// directorio de datos y se ejecuta con -File para evitar problemas de escape.
// Fuentes: Event 307 del log operativo (el instalador lo habilita) y la cola
// del spooler mediante System.Printing (no depende de WMI).
const PRINT_SCRIPT: &str = r##"$ErrorActionPreference = 'SilentlyContinue'
$dir = '__DIR__'
$lastFile = Join-Path $dir 'last_print.json'
$diagFile = Join-Path $dir 'print_diag.json'
$lines = New-Object System.Collections.ArrayList
$eventoErr = ''
$colaErr = ''
$spoolerErr = ''
$logErr = ''

function Normalizar-Doc([string]$s) {
  if ([string]::IsNullOrWhiteSpace($s)) { return '' }
  $base = [System.IO.Path]::GetFileNameWithoutExtension($s)
  $base = $base -replace '^(Microsoft Word|Microsoft Excel|Microsoft PowerPoint|Microsoft Edge|Adobe Acrobat|Adobe Reader)\s*[-–:]\s*', ''
  $base = $base -replace '[\s\-_()\[\].]+', ''
  return $base.ToLowerInvariant()
}

function Mime-Documento([string]$ruta) {
  switch ([System.IO.Path]::GetExtension($ruta).ToLowerInvariant()) {
    '.pdf'  { return 'application/pdf' }
    '.png'  { return 'image/png' }
    '.jpg'  { return 'image/jpeg' }
    '.jpeg' { return 'image/jpeg' }
    '.bmp'  { return 'image/bmp' }
    '.tif'  { return 'image/tiff' }
    '.tiff' { return 'image/tiff' }
    default { return '' }
  }
}

# Un PDF con contraseña no se puede mostrar en el visor web. Se descarta para
# que el agente adjunte el PDF generado desde el spool de impresión.
function EsPdfCifrado([string]$ruta) {
  try {
    if ([System.IO.Path]::GetExtension($ruta).ToLowerInvariant() -ne '.pdf') { return $false }
    $fs = [System.IO.File]::Open($ruta, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
    try {
      $leer = [int][Math]::Min(65536, $fs.Length)
      $fs.Position = $fs.Length - $leer
      $buf = New-Object byte[] $leer
      [void]$fs.Read($buf, 0, $leer)
      return ([System.Text.Encoding]::ASCII.GetString($buf).Contains('/Encrypt'))
    } finally { $fs.Dispose() }
  } catch { return $false }
}

# El log operativo de impresión suele venir deshabilitado. El instalador lo
# activa con elevación; aquí se vuelve a intentar por si el agente corre como admin.
try { wevtutil sl Microsoft-Windows-PrintService/Operational /e:true 2>$null | Out-Null } catch { $logErr = $_.Exception.Message }

# 1) Eventos 307: documento, usuario, impresora, páginas y fecha reales.
try {
  $last = 0
  if (Test-Path $lastFile) {
    try { $last = [long]((Get-Content $lastFile -Raw).Trim()) } catch { $last = 0 }
  }
  $eventos = @(Get-WinEvent -FilterHashtable @{ LogName='Microsoft-Windows-PrintService/Operational'; Id=307 } -ErrorAction Stop |
    Where-Object { $_.RecordId -gt $last })
  $maxId = $last
  foreach ($e in $eventos) {
    $p = $e.Properties
    $doc = if ($p.Count -gt 0) { [string]$p[0].Value } else { '' }
    $usr = if ($p.Count -gt 1) { [string]$p[1].Value } else { '' }
    $prn = if ($p.Count -gt 2) { [string]$p[2].Value } else { '' }
    $pag = if ($p.Count -gt 4) { [string]$p[4].Value } else { '1' }
    if (-not [string]::IsNullOrWhiteSpace($doc)) {
      $obj = [ordered]@{
        evento_id = "EVT-$($e.RecordId)"
        documento = $doc
        usuario = $usr
        impresora = $prn
        paginas = [int]$pag
        fecha = $e.TimeCreated.ToUniversalTime().ToString('o')
      }
      [void]$lines.Add(($obj | ConvertTo-Json -Compress))
    }
    if ($e.RecordId -gt $maxId) { $maxId = $e.RecordId }
  }
  if ($eventos.Count -gt 0) { Set-Content -Path $lastFile -Value $maxId }
} catch { $eventoErr = $_.Exception.Message }

# 2) Documento real: la tarea elevada copia los .spl del spooler y aquí se
# convierten a PDF (EMF) o se adjuntan tal cual (RAW). Va antes que la metadata
# para que el mismo trabajo se registre con su archivo.
try {
  $cs = Join-Path $dir 'impulsa_spooler.cs'
  if (Test-Path $cs) {
    Add-Type -Path $cs -ReferencedAssemblies @('System.Drawing','PresentationCore','WindowsBase','PresentationFramework','ReachFramework','System.Xaml','System.IO.Compression') -ErrorAction Stop
    $captureJson = [ImpulsaSpooler]::GetCaptureJson($dir)
    if (-not [string]::IsNullOrWhiteSpace($captureJson)) {
      foreach ($captureLine in ($captureJson -split "`n")) {
        if (-not [string]::IsNullOrWhiteSpace($captureLine)) { [void]$lines.Add($captureLine.Trim()) }
      }
    }
    $jobsJson = [ImpulsaSpooler]::GetJobsJson()
    if (-not [string]::IsNullOrWhiteSpace($jobsJson)) {
      foreach ($jobLine in ($jobsJson -split "`n")) {
        if (-not [string]::IsNullOrWhiteSpace($jobLine)) { [void]$lines.Add($jobLine.Trim()) }
      }
    }
  }
} catch { $spoolerErr = $_.Exception.Message }

# 3) Cola activa mediante System.Printing (respaldo adicional).
try {
  $dll = Join-Path $env:windir 'Microsoft.NET\Framework64\v4.0.30319\WPF\ReachFramework.dll'
  if (-not (Test-Path $dll)) { $dll = Join-Path $env:windir 'Microsoft.NET\Framework\v4.0.30319\WPF\ReachFramework.dll' }
  if (Test-Path $dll) {
    Add-Type -Path $dll
    $srv = New-Object System.Printing.PrintServer
    foreach ($q in $srv.GetPrintQueues()) {
      try { $trabajos = @($q.GetPrintJobInfoCollection()) } catch { continue }
      foreach ($j in $trabajos) {
        $doc = [string]$j.JobName
        if ([string]::IsNullOrWhiteSpace($doc)) { continue }
        $fecha = $j.TimeJobSubmitted
        $obj = [ordered]@{
          evento_id = "JOB-$($q.Name)-$($j.JobIdentifier)-$($fecha.Ticks)"
          documento = $doc
          usuario = [string]$j.Submitter
          impresora = [string]$q.Name
          paginas = [int]$j.NumberOfPages
          fecha = $fecha.ToUniversalTime().ToString('o')
        }
        [void]$lines.Add(($obj | ConvertTo-Json -Compress))
      }
    }
  }
} catch { $colaErr = $_.Exception.Message }

# 4) ARCHIVO ORIGINAL: el .spl de una impresora PCL no se puede ver en el
# navegador. Buscamos en las carpetas del usuario el PDF/imagen impreso: el
# nombre del trabajo suele ser exactamente el nombre del archivo. Se envía con
# el MISMO evento_id para que se adjunte al registro de esa impresión.
$indiceFile = Join-Path $dir 'archivos_index.json'
$raices = @(
  (Join-Path $env:USERPROFILE 'Desktop'),
  (Join-Path $env:USERPROFILE 'Documents'),
  (Join-Path $env:USERPROFILE 'Downloads'),
  'C:\Users\Public\Desktop',
  'C:\Users\Public\Documents'
)
$documentos = @()
try {
  if (Test-Path $indiceFile) {
    if ((Get-Item $indiceFile).LastWriteTime -gt (Get-Date).AddMinutes(-10)) {
      $indiceLeido = Get-Content $indiceFile -Raw | ConvertFrom-Json
      $documentos = @($indiceLeido | Where-Object { -not (EsPdfCifrado $_.Ruta) })
    }
  }
  if ($documentos.Count -eq 0) {
    $indice = @()
    foreach ($raiz in $raices) {
      if (-not (Test-Path $raiz)) { continue }
      foreach ($f in (Get-ChildItem $raiz -File -Recurse -ErrorAction SilentlyContinue)) {
        try {
          if ($f.FullName -match '\\(node_modules|\.git|AppData|ProgramData|Program Files)\\') { continue }
          $mime = Mime-Documento $f.FullName
          if (-not $mime -or (EsPdfCifrado $f.FullName)) { continue }
          $indice += [pscustomobject]@{
            Ruta = $f.FullName
            Nombre = $f.Name
            Mime = $mime
            Hora = $f.LastWriteTime
          }
        } catch {}
      }
    }
    $documentos = $indice
    try { Set-Content $indiceFile -Value ($documentos | ConvertTo-Json -Compress -Depth 4) -ErrorAction SilentlyContinue } catch {}
  }
} catch {}

# "Recientes" cubre archivos que ya no están en las carpetas comunes.
try {
  $shell = New-Object -ComObject WScript.Shell
  $recentDir = Join-Path $env:APPDATA 'Microsoft\Windows\Recent'
  foreach ($lnk in (Get-ChildItem $recentDir -Filter '*.lnk' -File -ErrorAction SilentlyContinue)) {
    try {
      $destino = $shell.CreateShortcut($lnk.FullName).TargetPath
      if (-not [string]::IsNullOrWhiteSpace($destino) -and (Test-Path -LiteralPath $destino -PathType Leaf)) {
        $mime = Mime-Documento $destino
        if ($mime -and -not (EsPdfCifrado $destino)) {
          $documentos += [pscustomobject]@{
            Ruta = $destino
            Nombre = [System.IO.Path]::GetFileName($destino)
            Mime = $mime
            Hora = $lnk.LastWriteTime
          }
        }
      }
    } catch {}
  }
} catch {}

if ($documentos.Count -gt 0) {
  $origentesFile = Join-Path $dir 'originales.json'
  $procesadosOriginal = @{}
  if (Test-Path $origentesFile) {
    try {
      $clavesLeidas = Get-Content $origentesFile -Raw | ConvertFrom-Json
      foreach ($claveGuardada in @($clavesLeidas)) {
        $procesadosOriginal[[string]$claveGuardada] = $true
      }
    } catch {}
  }

  foreach ($linea in @($lines)) {
    try {
      $o = $linea | ConvertFrom-Json
      if (-not $o) { continue }
      $archivoActual = [string]$o.archivo
      # Si el spooler ya entregó un PDF/imagen, no lo sobrescribimos. Los .spl
      # PCL/RAW sí se sustituyen por el archivo original legible del usuario.
      if ($archivoActual -and $archivoActual -notmatch '\.(spl|raw|prn)$') { continue }
      $norm = Normalizar-Doc ([string]$o.documento)
      if (-not $norm) { continue }
      $clave = ([string]$o.evento_id) + '|' + $norm
      if ($procesadosOriginal.ContainsKey($clave)) { continue }

      $horaPrint = [datetime]$o.fecha
      $candidatos = @($documentos | Where-Object { (Normalizar-Doc $_.Nombre) -eq $norm })
      if ($candidatos.Count -eq 0) {
        $candidatos = @($documentos | Where-Object {
          $n = Normalizar-Doc $_.Nombre
          $n.Length -ge 6 -and ($n.Contains($norm) -or $norm.Contains($n))
        })
      }
      if ($candidatos.Count -eq 0) {
        # El archivo pudo crearse después de construir el índice: busque dirigida.
        $base = [string]$o.documento -replace '^(Microsoft Word|Microsoft Excel|Microsoft PowerPoint|Adobe Acrobat|Adobe Reader)\s*[-–:]\s*', ''
        $base = [System.IO.Path]::GetFileNameWithoutExtension($base)
        if ($base.Length -ge 5) {
          foreach ($raiz in $raices) {
            if (-not (Test-Path $raiz)) { continue }
            foreach ($f in (Get-ChildItem $raiz -File -Recurse -Filter ('*' + $base + '*') -ErrorAction SilentlyContinue)) {
              $mime = Mime-Documento $f.FullName
              if ($mime -and -not (EsPdfCifrado $f.FullName)) {
                $candidatos += [pscustomobject]@{
                  Ruta = $f.FullName
                  Nombre = $f.Name
                  Mime = $mime
                  Hora = $f.LastWriteTime
                }
              }
            }
          }
        }
      }
      if ($candidatos.Count -eq 0) { continue }

      $mejor = $candidatos | Sort-Object { [math]::Abs(($_.Hora - $horaPrint).TotalHours) } | Select-Object -First 1
      # Copiar a un archivo temporal del agente: Rust lo borra después de subirlo,
      # nunca se toca el documento original del usuario.
      $temporal = Join-Path $dir ('original-' + [guid]::NewGuid().ToString('N').Substring(0, 10) + [System.IO.Path]::GetExtension($mejor.Ruta))
      Copy-Item -LiteralPath $mejor.Ruta -Destination $temporal -Force -ErrorAction Stop

      $adjunto = [ordered]@{
        evento_id = [string]$o.evento_id
        documento = [string]$o.documento
        usuario = [string]$o.usuario
        impresora = [string]$o.impresora
        paginas = [int]$o.paginas
        fecha = [string]$o.fecha
        archivo = $temporal
        archivo_nombre = $mejor.Nombre
        archivo_tipo = $mejor.Mime
      }
      [void]$lines.Add(($adjunto | ConvertTo-Json -Compress))
      $procesadosOriginal[$clave] = $true
    } catch {}
  }

  try {
    Set-Content -Path $origentesFile -Value (($procesadosOriginal.Keys | Sort-Object) | ConvertTo-Json -Compress) -ErrorAction SilentlyContinue
  } catch {}
}

$diag = [ordered]@{
  hora = (Get-Date).ToUniversalTime().ToString('o')
  eventos = $lines.Count
  evt = $eventoErr
  spooler = $spoolerErr
  cola = $colaErr
  log = $logErr
} | ConvertTo-Json -Compress
Set-Content -Path $diagFile -Value $diag -ErrorAction SilentlyContinue
$lines | ForEach-Object { Write-Output $_ }
"##;

// Script ejecutado por una tarea programada con privilegios SYSTEM. El agente
// lo escribe al iniciar; el instalador crea la tarea. Necesita elevación para
// leer C:\Windows\System32\spool\PRINTERS y conservar los trabajos impresos.
const SPOOL_CAPTURE_PS: &str = r##"$ErrorActionPreference = 'SilentlyContinue'
$destino = 'C:\ProgramData\IMPULSA\spool'
New-Item -ItemType Directory -Force -Path $destino | Out-Null

# La tarea corre como SYSTEM; dejar permisos al usuario para leer lo copiado.
try {
  $acl = Get-Acl $destino
  $regla = New-Object System.Security.AccessControl.FileSystemAccessRule('Users', 'ReadAndExecute', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
  $acl.AddAccessRule($regla)
  Set-Acl $destino $acl
} catch {}

# Conservar los trabajos después de imprimir para que el .spl no desaparezca.
try {
  $dll = Join-Path $env:windir 'Microsoft.NET\Framework64\v4.0.30319\WPF\ReachFramework.dll'
  if (-not (Test-Path $dll)) { $dll = Join-Path $env:windir 'Microsoft.NET\Framework\v4.0.30319\WPF\ReachFramework.dll' }
  if (Test-Path $dll) {
    Add-Type -Path $dll -ErrorAction Stop
    $servidor = New-Object System.Printing.PrintServer
    foreach ($cola in $servidor.GetPrintQueues()) {
      try {
        if (-not $cola.KeepPrintedJobs) { $cola.KeepPrintedJobs = $true; $cola.Commit() }
      } catch {}
    }
  }
} catch {}

$origen = 'C:\Windows\System32\spool\PRINTERS'
# Una sola tarea por minuto no alcanza: el spooler borra el .spl apenas termina
# la impresión. Escanear cada 2 segundos durante casi un minuto evita perderlo.
$mutex = New-Object System.Threading.Mutex($false, 'Local\IMPULSA-SpoolCapture')
if (-not $mutex.WaitOne(0)) { exit }
try {
  for ($i = 0; $i -lt 26; $i++) {
    # Marca de vida para saber si la tarea SYSTEM está corriendo.
    Set-Content -Path (Join-Path $destino 'capture_heartbeat.txt') -Value (Get-Date).ToString('o') -ErrorAction SilentlyContinue
    Get-ChildItem $origen -Filter '*.spl' -File -ErrorAction SilentlyContinue |
      Where-Object { $_.LastWriteTime -lt (Get-Date).AddSeconds(-1) -and $_.LastWriteTime -gt (Get-Date).AddDays(-1) } |
      ForEach-Object {
        # El spooler reutiliza nombres como 00003.spl; agregar la fecha evita
        # sobrescribir una captura anterior cuando el colador se recicla.
        $copia = Join-Path $destino ($_.LastWriteTime.ToString('yyyyMMdd-HHmmss') + '-' + $_.Name)
        if (-not (Test-Path $copia)) {
          try { Copy-Item $_.FullName $copia -Force -ErrorAction Stop } catch {}
        }
      }
    Start-Sleep -Seconds 2
  }
} finally {
  try { $mutex.ReleaseMutex() } catch {}
  try { $mutex.Dispose() } catch {}
}

Get-ChildItem $destino -Filter '*.spl' -File -ErrorAction SilentlyContinue |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-2) } |
  Remove-Item -Force -ErrorAction SilentlyContinue
"##;

// Helper C# que enumera los trabajos del spooler con la API nativa.
// System.Printing.GetPrintJobInfoCollection() falla en varias colas de este
// entorno y WMI está roto, así que esta es la fuente principal de impresiones.
const SPOOLER_CS: &str = r##"using System;
 using System.Collections.Generic;
 using System.Drawing;
 using System.Drawing.Imaging;
 using System.IO;
 using System.IO.Compression;
 using System.Text;
 using System.Text.RegularExpressions;
 using System.Runtime.InteropServices;
 using System.Windows;
 using System.Windows.Documents;
 using System.Windows.Media;
 using System.Windows.Media.Imaging;
 using System.Windows.Xps.Packaging;
 
 public static class ImpulsaSpooler
 {
     const int JOB2_SIZE = 160;
     const string SPOOL_INBOX = @"C:\ProgramData\IMPULSA\spool";
 
     [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
     struct PRINTER_INFO_4 { public IntPtr pPrinterName; public IntPtr pServerName; public uint Attributes; }
 
     [StructLayout(LayoutKind.Sequential)]
     struct SYSTEMTIME { public ushort Year, Month, DayOfWeek, Day, Hour, Minute, Second, Milliseconds; }
 
     // JOB_INFO_2 completo (Winspool.h). La versión anterior usaba JOB_INFO_1
     // sobre una cola nivel 2, por eso los datos del trabajo salían desplazados.
     [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
     struct JOB_INFO_2
     {
         public uint JobId;
         public IntPtr pPrinterName;
         public IntPtr pMachineName;
         public IntPtr pUserName;
         public IntPtr pDocument;
         public IntPtr pNotifyName;
         public IntPtr pDatatype;
         public IntPtr pPrintProcessor;
         public IntPtr pParameters;
         public IntPtr pDriverName;
         public IntPtr pDevMode;
         public IntPtr pStatus;
         public IntPtr pSecurityDescriptor;
         public uint Status;
         public uint Priority;
         public uint Position;
         public uint StartTime;
         public uint UntilTime;
         public uint TotalPages;
         public uint Size;
         public SYSTEMTIME Submitted;
         public uint Time;
         public uint PagesPrinted;
     }
 
     class JobInfo
     {
         public string Printer = "";
         public string Document = "";
         public string User = "";
         public string Datatype = "";
         public uint JobId;
         public uint Pages;
         public DateTime FechaUtc;
     }
 
     [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
     static extern bool EnumPrinters(uint flags, IntPtr name, uint level, IntPtr buf, uint cb, out uint needed, out uint returned);
 
     [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
     static extern bool OpenPrinter(string name, out IntPtr handle, IntPtr defaults);
 
     [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
     static extern bool EnumJobs(IntPtr handle, uint first, uint count, uint level, IntPtr buf, uint cb, out uint needed, out uint returned);
 
     [DllImport("winspool.drv", SetLastError = true)]
     static extern bool ClosePrinter(IntPtr handle);
 
     static string Esc(string s)
     {
         if (s == null) return "";
         return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", " ").Replace("\n", " ");
     }
 
     static string Str(IntPtr p, IntPtr lo, IntPtr hi)
     {
         if (p == IntPtr.Zero) return "";
         long v = p.ToInt64();
         if (v < lo.ToInt64() || v >= hi.ToInt64()) return "";
         try { return Marshal.PtrToStringUni(p) ?? ""; } catch { return ""; }
     }
 
     static List<JobInfo> GetJobs()
     {
         var lista = new List<JobInfo>();
         uint needed = 0, returned = 0;
         EnumPrinters(6, IntPtr.Zero, 4, IntPtr.Zero, 0, out needed, out returned);
         if (needed == 0) return lista;
         IntPtr printers = Marshal.AllocHGlobal((int)needed);
         try
         {
             if (!EnumPrinters(6, IntPtr.Zero, 4, printers, needed, out needed, out returned)) return lista;
             int printerSize = Marshal.SizeOf(typeof(PRINTER_INFO_4));
             IntPtr printersEnd = IntPtr.Add(printers, (int)needed);
             for (int i = 0; i < returned; i++)
             {
                 var info = (PRINTER_INFO_4)Marshal.PtrToStructure(IntPtr.Add(printers, i * printerSize), typeof(PRINTER_INFO_4));
                 string printer = Str(info.pPrinterName, printers, printersEnd);
                 if (string.IsNullOrWhiteSpace(printer)) continue;
                 IntPtr handle;
                 if (!OpenPrinter(printer, out handle, IntPtr.Zero)) continue;
                 try
                 {
                     const int bufferSize = 1024 * 1024;
                     IntPtr jobsBuf = Marshal.AllocHGlobal(bufferSize);
                     uint jobsNeeded = 0, jobsCount = 0;
                     try
                     {
                         if (!EnumJobs(handle, 0, 100, 2, jobsBuf, bufferSize, out jobsNeeded, out jobsCount)) continue;
                         IntPtr jobsEnd = IntPtr.Add(jobsBuf, bufferSize);
                         for (int j = 0; j < jobsCount && j < 100; j++)
                         {
                             IntPtr row = IntPtr.Add(jobsBuf, j * JOB2_SIZE);
                             var job = (JOB_INFO_2)Marshal.PtrToStructure(row, typeof(JOB_INFO_2));
                             string doc = Str(job.pDocument, jobsBuf, jobsEnd);
                             if (string.IsNullOrWhiteSpace(doc)) continue;
                             DateTime fecha;
                             try
                             {
                                 fecha = new DateTime(job.Submitted.Year, job.Submitted.Month, job.Submitted.Day,
                                     job.Submitted.Hour, job.Submitted.Minute, job.Submitted.Second, DateTimeKind.Utc);
                             }
                             catch { fecha = DateTime.UtcNow; }
                             lista.Add(new JobInfo
                             {
                                 Printer = printer,
                                 Document = doc,
                                 User = Str(job.pUserName, jobsBuf, jobsEnd),
                                 Datatype = Str(job.pDatatype, jobsBuf, jobsEnd),
                                 JobId = job.JobId,
                                 Pages = job.TotalPages,
                                 FechaUtc = fecha,
                             });
                         }
                     }
                     finally { Marshal.FreeHGlobal(jobsBuf); }
                 }
                 finally { ClosePrinter(handle); }
             }
         }
         finally { Marshal.FreeHGlobal(printers); }
         return lista;
     }
 
     public static string GetJobsJson()
     {
         var sb = new StringBuilder();
         foreach (var job in GetJobs())
         {
             if (job.FechaUtc.ToLocalTime().Date != DateTime.Today) continue;
             sb.Append("{\"evento_id\":\"JOB-").Append(Esc(job.Printer)).Append('-').Append(job.JobId)
               .Append('-').Append(job.FechaUtc.Ticks).Append("\",\"documento\":\"").Append(Esc(job.Document))
               .Append("\",\"usuario\":\"").Append(Esc(job.User))
               .Append("\",\"impresora\":\"").Append(Esc(job.Printer))
               .Append("\",\"paginas\":").Append(job.Pages)
               .Append(",\"fecha\":\"").Append(job.FechaUtc.ToString("o"))
               .Append("\"}\n");
         }
         return sb.ToString();
     }
 
     static HashSet<string> LeerProcesados(string path)
     {
         var set = new HashSet<string>();
         if (!File.Exists(path)) return set;
         string texto = File.ReadAllText(path);
         foreach (string parte in texto.Split(','))
         {
             string limpio = parte.Trim().Trim('[', ']', '"');
             if (limpio.Length > 0) set.Add(limpio);
         }
         return set;
     }
 
     static void GuardarProcesados(string path, HashSet<string> set)
     {
         var sb = new StringBuilder("[");
         bool primero = true;
         foreach (string nombre in set)
         {
             if (!primero) sb.Append(',');
             sb.Append('"').Append(Esc(nombre)).Append('"');
             primero = false;
         }
         sb.Append(']');
         File.WriteAllText(path, sb.ToString());
     }
 
     static string NombreSeguro(string nombre)
     {
         char[] invalidos = Path.GetInvalidFileNameChars();
         var sb = new StringBuilder();
         foreach (char c in nombre)
         {
             if (Array.IndexOf(invalidos, c) >= 0 || c == '"' || c == ';') sb.Append('_');
             else sb.Append(c);
         }
         string resultado = sb.ToString();
         return resultado.Length > 80 ? resultado.Substring(0, 80) : resultado;
     }
 
     static bool EsEmf(byte[] datos)
     {
         return datos.Length > 4 && datos[0] == 1 && datos[1] == 0 && datos[2] == 0 && datos[3] == 0;
     }

     // Las impresoras XPS/OXPS guardan un ZIP con FixedDocumentSequence dentro
     // del .spl. Es un documento real y se puede convertir a PDF para el visor.
     static bool ContieneAscii(byte[] datos, string texto)
     {
         if (datos == null || datos.Length == 0 || string.IsNullOrEmpty(texto)) return false;
         byte[] buscado = Encoding.ASCII.GetBytes(texto);
         for (int i = 0; i <= datos.Length - buscado.Length; i++)
         {
             bool igual = true;
             for (int j = 0; j < buscado.Length; j++)
             {
                 if (datos[i + j] != buscado[j]) { igual = false; break; }
             }
             if (igual) return true;
         }
         return false;
     }

     static bool EsXps(byte[] datos)
     {
         return datos.Length > 4 && datos[0] == (byte)'P' && datos[1] == (byte)'K'
             && (ContieneAscii(datos, "FixedDocumentSequence") || ContieneAscii(datos, "Documents/1/"));
     }

     // El spooler escribe XPS/OXPS como ZIP en flujo: cabeceras locales con
     // descriptores de datos, sin directorio central y con partes fragmentadas
     // en "[n].piece". WPF no puede abrirlo directamente, así que se reconstruye
     // un paquete XPS normal antes de renderizarlo a PDF.
     static int IndexOfBytes(byte[] datos, byte[] patron, int desde)
     {
         for (int i = desde; i <= datos.Length - patron.Length; i++)
         {
             bool igual = true;
             for (int j = 0; j < patron.Length; j++)
             {
                 if (datos[i + j] != patron[j]) { igual = false; break; }
             }
             if (igual) return i;
         }
         return -1;
     }

     static byte[] CerrarXml(string nombre, byte[] contenido)
     {
         string ext = Path.GetExtension(nombre).ToLowerInvariant();
         bool esXml = ext == ".xml" || ext == ".rels" || ext == ".fdoc"
             || ext == ".fdseq" || ext == ".dict" || nombre == "[Content_Types].xml";
         if (!esXml) return contenido;
         try
         {
             string s = Encoding.UTF8.GetString(contenido).TrimEnd();
             Match m = Regex.Match(s, @"<([A-Za-z_][\w:.-]*)");
             if (!m.Success) return contenido;
             string raiz = m.Groups[1].Value;
             if (!s.EndsWith("</" + raiz + ">")) s += "</" + raiz + ">";
             return Encoding.UTF8.GetBytes(s);
         }
         catch { return contenido; }
     }

     static byte[] Miniatura(Visual visual)
     {
         const int w = 32, h = 32;
         RenderTargetBitmap bmp = new RenderTargetBitmap(w, h, 96, 96, PixelFormats.Pbgra32);
         DrawingVisual dv = new DrawingVisual();
         using (DrawingContext ctx = dv.RenderOpen())
         {
             ctx.DrawRectangle(System.Windows.Media.Brushes.White, null, new Rect(0, 0, w, h));
             ctx.DrawRectangle(new VisualBrush(visual), null, new Rect(0, 0, w, h));
         }
         bmp.Render(dv);
         byte[] pixeles = new byte[w * 4 * h];
         bmp.CopyPixels(pixeles, w * 4, 0);
         return pixeles;
     }

     static bool BytesIguales(byte[] a, byte[] b)
     {
         if (a == null || b == null || a.Length != b.Length) return false;
         for (int i = 0; i < a.Length; i++) if (a[i] != b[i]) return false;
         return true;
     }

     static byte[] RebuildXps(byte[] datos)
     {
         try
         {
             var firmas = new Dictionary<string, SortedDictionary<int, byte[]>>();
             var sueltos = new Dictionary<string, byte[]>();
             byte[] descriptor = { 0x50, 0x4B, 0x07, 0x08 };
             int off = 0;
             while (off + 30 <= datos.Length)
             {
                 if (datos[off] != 0x50 || datos[off + 1] != 0x4B || datos[off + 2] != 0x03 || datos[off + 3] != 0x04) break;
                 int flags = BitConverter.ToUInt16(datos, off + 6);
                 int method = BitConverter.ToUInt16(datos, off + 8);
                 int nombreLen = BitConverter.ToUInt16(datos, off + 26);
                 int extraLen = BitConverter.ToUInt16(datos, off + 28);
                 string nombre = Encoding.UTF8.GetString(datos, off + 30, nombreLen);
                 int inicio = off + 30 + nombreLen + extraLen;
                 int finDatos;
                 int siguiente;
                 if ((flags & 8) != 0)
                 {
                     int desc = IndexOfBytes(datos, descriptor, inicio);
                     if (desc < 0) break;
                     finDatos = desc;
                     siguiente = desc + 16;
                 }
                 else
                 {
                     int compSize = BitConverter.ToInt32(datos, off + 18);
                     finDatos = inicio + compSize;
                     siguiente = finDatos;
                 }
                 if (finDatos < inicio || finDatos > datos.Length) break;
                 int tamComprimido = finDatos - inicio;
                 byte[] comprimido = new byte[tamComprimido];
                 Buffer.BlockCopy(datos, inicio, comprimido, 0, tamComprimido);
                 byte[] contenido;
                 if (method == 8)
                 {
                     using (var entrada = new MemoryStream(comprimido))
                     using (var descomprimir = new DeflateStream(entrada, CompressionMode.Decompress))
                     using (var salida = new MemoryStream())
                     {
                         descomprimir.CopyTo(salida);
                         contenido = salida.ToArray();
                     }
                 }
                 else contenido = comprimido;

                 Match pieza = Regex.Match(nombre, @"^(.*)/\[(\d+)\](?:\.last)?\.piece$");
                 if (pieza.Success)
                 {
                     string baseNombre = pieza.Groups[1].Value;
                     int indice = int.Parse(pieza.Groups[2].Value);
                     if (!firmas.ContainsKey(baseNombre)) firmas[baseNombre] = new SortedDictionary<int, byte[]>();
                     firmas[baseNombre][indice] = contenido;
                 }
                 else if (!sueltos.ContainsKey(nombre)) sueltos[nombre] = contenido;
                 off = siguiente;
             }
             if (firmas.Count == 0 && sueltos.Count == 0) return null;

             using (var ms = new MemoryStream())
             {
                 using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, true))
                 {
                     foreach (var kv in firmas)
                     {
                         using (var parte = new MemoryStream())
                         {
                             foreach (var pieza in kv.Value) parte.Write(pieza.Value, 0, pieza.Value.Length);
                             byte[] contenido = CerrarXml(kv.Key, parte.ToArray());
                             var entry = zip.CreateEntry(kv.Key);
                             using (var es = entry.Open()) es.Write(contenido, 0, contenido.Length);
                         }
                     }
                     foreach (var kv in sueltos)
                     {
                         byte[] contenido = CerrarXml(kv.Key, kv.Value);
                         var entry = zip.CreateEntry(kv.Key);
                         using (var es = entry.Open()) es.Write(contenido, 0, contenido.Length);
                     }
                 }
                 return ms.ToArray();
             }
         }
         catch { return null; }
     }

     static int PaginasCopia(byte[] paquete)
     {
         try
         {
             using (var ms = new MemoryStream(paquete))
             using (var zip = new ZipArchive(ms, ZipArchiveMode.Read))
             {
                 string primero = null;
                 foreach (var entry in zip.Entries)
                 {
                     if (!entry.FullName.EndsWith(".fpage", StringComparison.OrdinalIgnoreCase)) continue;
                     using (var sr = new StreamReader(entry.Open()))
                     {
                         var refs = new List<string>();
                         MatchCollection m = Regex.Matches(sr.ReadToEnd(), @"Resources/Images/[^""'\s>]+\.JPG", RegexOptions.IgnoreCase);
                         foreach (Match item in m) refs.Add(item.Value.ToLowerInvariant());
                         refs.Sort();
                         string firma = string.Join("|", refs);
                         if (primero == null) primero = firma;
                         else if (firma != primero) return 0;
                     }
                 }
                 return primero == null ? 0 : 1;
             }
         }
         catch { return 0; }
     }

     static byte[] XpsToPdf(byte[] datos)
     {
         byte[] paquete = RebuildXps(datos) ?? datos;
         string temporal = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N") + ".xps");
         File.WriteAllBytes(temporal, paquete);
         try
         {
             XpsDocument doc = new XpsDocument(temporal, FileAccess.Read);
             try
             {
                 FixedDocumentSequence seq = doc.GetFixedDocumentSequence();
                 if (seq == null) throw new Exception("XPS sin FixedDocumentSequence");
                 DocumentPaginator paginator = ((IDocumentPaginatorSource)seq).DocumentPaginator;
                 var jpegs = new List<byte[]>();
                 var widths = new List<int>();
                 var heights = new List<int>();
                 var minis = new List<byte[]>();
                 int paginas = Math.Max(1, paginator.PageCount);
                 if (PaginasCopia(paquete) == 1) paginas = 1;
                 for (int p = 0; p < paginas; p++)
                 {
                     DocumentPage pagina = paginator.GetPage(p);
                     Visual visual = pagina.Visual;
                     if (visual == null) continue;
                     Rect bounds = VisualTreeHelper.GetDescendantBounds(visual);
                     int w = Math.Max(1, (int)Math.Ceiling(bounds.Width));
                     int h = Math.Max(1, (int)Math.Ceiling(bounds.Height));
                     double escala = Math.Min(1.0, 1800.0 / Math.Max(w, h));
                     if (escala < 1.0) { w = Math.Max(1, (int)(w * escala)); h = Math.Max(1, (int)(h * escala)); }
                     RenderTargetBitmap bmp = new RenderTargetBitmap(w, h, 96, 96, PixelFormats.Pbgra32);
                     DrawingVisual dv = new DrawingVisual();
                     using (DrawingContext ctx = dv.RenderOpen())
                     {
                         ctx.DrawRectangle(System.Windows.Media.Brushes.White, null, new Rect(0, 0, w, h));
                         ctx.DrawRectangle(new VisualBrush(visual), null, new Rect(0, 0, w, h));
                     }
                     bmp.Render(dv);
                     using (var ms = new MemoryStream())
                     {
                         var encoder = new JpegBitmapEncoder();
                         encoder.Frames.Add(BitmapFrame.Create(bmp));
                         encoder.Save(ms);
                         byte[] jpeg = ms.ToArray();
                         byte[] mini = Miniatura(visual);
                         // Impresiones de varias copias generan páginas XPS
                         // idénticas; el visor solo necesita una.
                         if (jpegs.Count == 0 || !BytesIguales(minis[minis.Count - 1], mini))
                         {
                             jpegs.Add(jpeg);
                             widths.Add(w);
                             heights.Add(h);
                             minis.Add(mini);
                         }
                     }
                 }
                 if (jpegs.Count == 0) throw new Exception("XPS sin paginas renderizables");
                 return ImagesToPdf(jpegs, widths, heights);
             }
             finally
             {
                 try { doc.Close(); } catch {}
             }
         }
         finally
         {
             try { File.Delete(temporal); } catch {}
         }
     }

     static MemoryStream pdfStream;
 
     static byte[] Ascii(string s) { return Encoding.ASCII.GetBytes(s); }
 
     static void PdfW(string s) { byte[] b = Ascii(s); pdfStream.Write(b, 0, b.Length); }
 
     static void PdfWB(byte[] b) { pdfStream.Write(b, 0, b.Length); }
 
     static byte[] ImagesToPdf(List<byte[]> jpegs, List<int> widths, List<int> heights)
     {
         pdfStream = new MemoryStream();
         int n = jpegs.Count;
         int[] off = new int[2 + n * 3 + 1];
         PdfW("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
         off[1] = (int)pdfStream.Length; PdfW("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
         off[2] = (int)pdfStream.Length;
         PdfW("2 0 obj\n<< /Type /Pages /Kids [");
         for (int i = 0; i < n; i++) PdfW((3 + i * 3) + " 0 R ");
         PdfW("] /Count " + n + " >>\nendobj\n");
         for (int i = 0; i < n; i++)
         {
             int page = 3 + i * 3, content = page + 1, img = page + 2;
             off[page] = (int)pdfStream.Length;
             PdfW(page + " 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + widths[i] + " " + heights[i]
               + "] /Resources << /XObject << /Im0 " + img + " 0 R >> >> /Contents " + content + " 0 R >>\nendobj\n");
             string draw = "q\n" + widths[i] + " 0 0 " + heights[i] + " 0 0 cm\n/Im0 Do\nQ\n";
             off[content] = (int)pdfStream.Length;
             PdfW(content + " 0 obj\n<< /Length " + Ascii(draw).Length + " >>\nstream\n" + draw + "endstream\nendobj\n");
             off[img] = (int)pdfStream.Length;
             PdfW(img + " 0 obj\n<< /Type /XObject /Subtype /Image /Width " + widths[i] + " /Height " + heights[i]
               + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jpegs[i].Length + " >>\nstream\n");
             PdfWB(jpegs[i]);
             PdfW("\nendstream\nendobj\n");
         }
         int xref = (int)pdfStream.Length;
         int total = 2 + n * 3;
         PdfW("xref\n0 " + (total + 1) + "\n0000000000 65535 f \n");
         for (int i = 1; i <= total; i++) PdfW(off[i].ToString("D10") + " 00000 n \n");
         PdfW("trailer\n<< /Size " + (total + 1) + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
         return pdfStream.ToArray();
     }
 
     static byte[] EmfToPdf(byte[] emf)
     {
         using (var ms = new MemoryStream(emf))
         using (var mf = new Metafile(ms))
         {
             Guid[] dims = mf.FrameDimensionsList;
             int paginas = dims != null && dims.Length > 0 ? mf.GetFrameCount(new FrameDimension(dims[0])) : 1;
             if (paginas < 1) paginas = 1;
             var jpegs = new List<byte[]>();
             var widths = new List<int>();
             var heights = new List<int>();
             for (int p = 0; p < paginas; p++)
             {
                 if (dims != null && dims.Length > 0) mf.SelectActiveFrame(new FrameDimension(dims[0]), p);
                 int w = Math.Max(1, (int)mf.Width);
                 int h = Math.Max(1, (int)mf.Height);
                 double escala = Math.Min(1.0, 1800.0 / Math.Max(w, h));
                 if (escala < 1.0) { w = Math.Max(1, (int)(w * escala)); h = Math.Max(1, (int)(h * escala)); }
                 using (var bmp = new Bitmap(w, h))
                 {
                     using (var g = Graphics.FromImage(bmp))
                     {
                         g.Clear(System.Drawing.Color.White);
                         g.DrawImage(mf, new Rectangle(0, 0, w, h));
                     }
                     using (var jpg = new MemoryStream())
                     {
                         bmp.Save(jpg, ImageFormat.Jpeg);
                         jpegs.Add(jpg.ToArray());
                         widths.Add(w);
                         heights.Add(h);
                     }
                 }
             }
             return ImagesToPdf(jpegs, widths, heights);
         }
     }
 
     static string Linea(string id, string doc, string user, string printer, uint paginas, DateTime fecha, string archivo, string nombre, string mime, long size)
     {
         return "{\"evento_id\":\"" + Esc(id) + "\",\"documento\":\"" + Esc(doc)
             + "\",\"usuario\":\"" + Esc(user) + "\",\"impresora\":\"" + Esc(printer)
             + "\",\"paginas\":" + paginas + ",\"fecha\":\"" + fecha.ToString("o")
             + "\",\"archivo\":\"" + Esc(archivo) + "\",\"archivo_nombre\":\"" + Esc(nombre)
             + "\",\"archivo_tipo\":\"" + Esc(mime) + "\",\"archivo_size\":" + size + "}\n";
     }
 
     // Convierte los .spl copiados por la tarea elevada en documentos visibles.
     public static string GetCaptureJson(string dir)
     {
         var sb = new StringBuilder();
         if (!Directory.Exists(SPOOL_INBOX)) return "";
         string donePath = Path.Combine(dir, "processed_spool.json");
         HashSet<string> procesados = LeerProcesados(donePath);
         List<JobInfo> trabajos = GetJobs();
         foreach (string archivo in Directory.GetFiles(SPOOL_INBOX, "*.spl"))
         {
             string nombreSpl = Path.GetFileName(archivo);
             if (procesados.Contains(nombreSpl)) continue;
             byte[] datos;
             try { datos = File.ReadAllBytes(archivo); } catch { continue; }
             if (datos.Length == 0) { procesados.Add(nombreSpl); continue; }
 
             DateTime mtime = File.GetLastWriteTimeUtc(archivo);
             JobInfo mejor = null;
             double mejorDiferencia = double.MaxValue;
             foreach (var trabajo in trabajos)
             {
                 double diferencia = Math.Abs((mtime - trabajo.FechaUtc).TotalMinutes);
                 if (diferencia < mejorDiferencia) { mejorDiferencia = diferencia; mejor = trabajo; }
             }
             if (mejorDiferencia > 15) mejor = null;
 
             string doc = mejor != null ? mejor.Document : Path.GetFileNameWithoutExtension(nombreSpl);
             string usuario = mejor != null ? mejor.User : "";
             string impresora = mejor != null ? mejor.Printer : "";
             uint paginas = mejor != null && mejor.Pages > 0 ? mejor.Pages : 1;
             DateTime fecha = mejor != null ? mejor.FechaUtc : mtime;
             // Si el .spl se pudo asociar a un trabajo de la cola, usar el MISMO
             // evento_id que la metadata: así el backend actualiza ese registro
             // con el archivo en vez de crear una impresión duplicada.
             string id = mejor != null
                 ? "JOB-" + mejor.Printer + "-" + mejor.JobId + "-" + mejor.FechaUtc.Ticks
                 : "SPL-" + Path.GetFileNameWithoutExtension(nombreSpl) + "-" + datos.Length;
 
             string salida, mime, nombreSalida;
             try
             {
                 if (EsEmf(datos))
                 {
                     byte[] pdf = EmfToPdf(datos);
                     nombreSalida = NombreSeguro(doc) + ".pdf";
                     salida = Path.Combine(dir, "capture-" + Guid.NewGuid().ToString("N").Substring(0, 8) + "-" + nombreSalida);
                     File.WriteAllBytes(salida, pdf);
                     mime = "application/pdf";
                 }
                 else if (EsXps(datos))
                 {
                     byte[] pdf = XpsToPdf(datos);
                     nombreSalida = NombreSeguro(doc) + ".pdf";
                     salida = Path.Combine(dir, "capture-" + Guid.NewGuid().ToString("N").Substring(0, 8) + "-" + nombreSalida);
                     File.WriteAllBytes(salida, pdf);
                     mime = "application/pdf";
                 }
                 else
                 {
                     nombreSalida = NombreSeguro(doc) + ".spl";
                     salida = Path.Combine(dir, "capture-" + Guid.NewGuid().ToString("N").Substring(0, 8) + "-" + nombreSalida);
                     File.WriteAllBytes(salida, datos);
                     mime = "application/octet-stream";
                 }
             }
             catch
             {
                 nombreSalida = NombreSeguro(doc) + ".spl";
                 salida = Path.Combine(dir, "capture-" + Guid.NewGuid().ToString("N").Substring(0, 8) + "-" + nombreSalida);
                 try
                 {
                     File.WriteAllBytes(salida, datos);
                     mime = "application/octet-stream";
                 }
                 catch { continue; }
             }
 
             sb.Append(Linea(id, doc, usuario, impresora, paginas, fecha, salida, nombreSalida, mime, new FileInfo(salida).Length));
             procesados.Add(nombreSpl);
         }
         GuardarProcesados(donePath, procesados);
         return sb.ToString();
     }
 }
 "##;

// Reporta las impresiones reales de Windows al backend.
fn start_print_watcher(storage_dir: PathBuf) {
    std::thread::spawn(move || {
        use std::process::Command;
        #[cfg(windows)]
        use std::os::windows::process::CommandExt;
        #[cfg(windows)]
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let api = load_scan_config()
            .servidor
            .unwrap_or_else(|| DEFAULT_API.to_string());
        fs::create_dir_all(&storage_dir).ok();

        // La tarea programada elevada necesita este script. Se reescribe en cada
        // arranque para que una reinstallación no dependa del orden de ejecución.
        let captura_dir = PathBuf::from(r"C:\ProgramData\IMPULSA");
        fs::create_dir_all(captura_dir.join("spool")).ok();
        let _ = fs::write(captura_dir.join("capture_spool.ps1"), SPOOL_CAPTURE_PS);

        let dir = storage_dir.to_string_lossy().replace('\'', "''");
        let script_path = storage_dir.join("impulsa_print.ps1");
        if fs::write(storage_dir.join("impulsa_spooler.cs"), SPOOLER_CS).is_err()
            || fs::write(&script_path, PRINT_SCRIPT.replace("__DIR__", &dir)).is_err()
        {
            return;
        }

        let seen_path = storage_dir.join("seen_prints.json");
        let mut seen: HashSet<String> = fs::read_to_string(&seen_path)
            .ok()
            .and_then(|s| serde_json::from_str::<Vec<String>>(&s).ok())
            .map(|v| v.into_iter().collect())
            .unwrap_or_default();

        loop {
            std::thread::sleep(Duration::from_secs(2));

            // El código de emparejamiento puede guardarse después de arrancar.
            let (pairing, name) = load_pairing(&storage_dir);
            let pc = if pairing.is_empty() { name } else { pairing };
            if pc.is_empty() {
                continue;
            }

            let mut cmd = Command::new("powershell.exe");
            cmd.arg("-NoProfile")
                .arg("-NonInteractive")
                .arg("-ExecutionPolicy")
                .arg("Bypass")
                .arg("-File")
                .arg(&script_path);
            #[cfg(windows)]
            cmd.creation_flags(CREATE_NO_WINDOW);
            let out = match cmd.output() {
                Ok(out) => out,
                Err(_) => continue,
            };

            let mut hubo_nuevos = false;
            for line in String::from_utf8_lossy(&out.stdout).lines() {
                let line = line.trim();
                if line.is_empty() {
                    continue;
                }
                let value: serde_json::Value = match serde_json::from_str(line) {
                    Ok(v) => v,
                    Err(_) => continue,
                };
                let field = |key: &str| {
                    value
                        .get(key)
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string()
                };
                let documento = field("documento");
                if documento.is_empty() {
                    continue;
                }
                let id = field("evento_id");
                let archivo = field("archivo");
                // La metadata se registra primero con este ID. Cuando llega el
                // documento capturado con el MISMO ID debe poder subirse igual:
                // el backend hace UPSERT y lo adjunta al registro existente.
                let ya_visto = !seen.insert(id.clone());
                if id.is_empty() || (ya_visto && archivo.is_empty()) {
                    continue;
                }
                hubo_nuevos = true;
                let paginas = value
                    .get("paginas")
                    .and_then(|v| v.as_i64())
                    .unwrap_or(1);
                if !archivo.is_empty() {
                    let ruta = PathBuf::from(&archivo);
                    if ruta.is_file() {
                        post_print_file(
                            &pc,
                            &id,
                            &documento,
                            &field("usuario"),
                            &field("impresora"),
                            paginas,
                            &field("fecha"),
                            &ruta,
                            &field("archivo_nombre"),
                            &field("archivo_tipo"),
                            &api,
                        );
                        fs::remove_file(&ruta).ok();
                    }
                } else {
                    let payload = serde_json::json!({
                        "pc": pc,
                        "evento_id": id,
                        "documento": documento,
                        "usuario": field("usuario"),
                        "impresora": field("impresora"),
                        "paginas": paginas,
                        "copias": 1,
                        "fecha": field("fecha"),
                    })
                    .to_string();
                    post_json("/api/pc/print", &payload, &api);
                }
            }
            if hubo_nuevos {
                let lista: Vec<String> = seen.iter().cloned().collect();
                let _ = fs::write(&seen_path, serde_json::to_string(&lista).unwrap_or_default());
            }
        }
    });
}

// El heartbeat anterior era un .bat independiente: marcaba la PC como en línea
// aunque el agente estuviera cerrado. Se reemplaza por un arranque directo del
// agente, que es quien ahora envía el heartbeat mientras está vivo.
fn ensure_agent_startup() -> Result<(), String> {
    use std::env;
    let startup_dir = env::var("APPDATA")
        .map(|appdata| PathBuf::from(appdata).join("Microsoft").join("Windows").join("Start Menu").join("Programs").join("Startup"))
        .map_err(|e| format!("Failed to get APPDATA: {}", e))?;

    let legacy = startup_dir.join("impulsa_heartbeat.bat");
    if legacy.exists() {
        fs::remove_file(&legacy).map_err(|e| e.to_string())?;
    }

    let exe = std::env::current_exe()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| "C:\\Program Files\\IMPULSA-Agent\\app.exe".to_string());
    let exe_vbs = exe.replace('"', "\"\"");
    let vbs_script = format!(
        r#"Set WshShell = CreateObject("WScript.Shell")
WshShell.Run Chr(34) & "{}" & Chr(34), 0, False"#,
        exe_vbs
    );
    let vbs_path = startup_dir.join("impulsa_run.vbs");
    fs::write(&vbs_path, vbs_script).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn install_startup_script(
    _server_url: String,
    _pairing_code: String,
    _pc_name: String,
) -> Result<(), String> {
    ensure_agent_startup()
}

#[tauri::command]
fn hide_to_tray(app: tauri::AppHandle) -> Result<(), String> {
    let window = app.get_webview_window("main").ok_or("no window")?;
    window.hide().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn remove_startup_script() -> Result<(), String> {
    use std::env;
    let startup_dir = env::var("APPDATA")
        .map(|appdata| PathBuf::from(appdata).join("Microsoft").join("Windows").join("Start Menu").join("Programs").join("Startup"))
        .map_err(|e| format!("Failed to get APPDATA: {}", e))?;

    let bat_path = startup_dir.join("impulsa_heartbeat.bat");
    let vbs_path = startup_dir.join("impulsa_run.vbs");

    if bat_path.exists() {
        fs::remove_file(&bat_path).map_err(|e| e.to_string())?;
    }
    if vbs_path.exists() {
        fs::remove_file(&vbs_path).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let window = app.get_webview_window("main").unwrap();
            let tray = app.tray_by_id("main-tray").unwrap();

            let show_item = tauri::menu::MenuItem::with_id(
                app,
                "show",
                "Abrir",
                true,
                None::<&str>,
            )?;
            let quit_item = tauri::menu::MenuItem::with_id(
                app,
                "quit",
                "Salir",
                true,
                None::<&str>,
            )?;

            let menu = tauri::menu::Menu::with_items(app, &[&show_item, &quit_item])?;
            tray.set_menu(Some(menu))?;

            let window_menu = window.clone();
            tray.on_menu_event(move |_app, event| match event.id().as_ref() {
                "show" => {
                    show_window(&window_menu);
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            });

            let window_click = window.clone();
            tray.on_tray_icon_event(move |_tray, event| {
                if let tauri::tray::TrayIconEvent::Click {
                    button: tauri::tray::MouseButton::Left,
                    button_state: tauri::tray::MouseButtonState::Up,
                    ..
                } = event
                {
                    let visible = window_click.is_visible().unwrap_or(false);
                    if visible {
                        window_click.hide().ok();
                    } else {
                        show_window(&window_click);
                    }
                }
            });

            let data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| PathBuf::from("."));
            let _ = ensure_agent_startup();
            start_heartbeat(data_dir.clone());
            start_scan_watcher(data_dir.clone());
            start_print_watcher(data_dir);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            get_local_ip,
            get_mac_address,
            save_state,
            load_state,
            clear_state,
            install_startup_script,
            remove_startup_script,
            hide_to_tray,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn show_window(window: &tauri::WebviewWindow) {
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
}
