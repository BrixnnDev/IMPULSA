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
$logErr = ''

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

# 2) Cola activa del spooler, sin WMI (WMI está roto en algunas PCs).
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

$diag = [ordered]@{
  hora = (Get-Date).ToUniversalTime().ToString('o')
  eventos = $lines.Count
  evt = $eventoErr
  cola = $colaErr
  log = $logErr
} | ConvertTo-Json -Compress
Set-Content -Path $diagFile -Value $diag -ErrorAction SilentlyContinue
$lines | ForEach-Object { Write-Output $_ }
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

        let dir = storage_dir.to_string_lossy().replace('\'', "''");
        let script_path = storage_dir.join("impulsa_print.ps1");
        if fs::write(&script_path, PRINT_SCRIPT.replace("__DIR__", &dir)).is_err() {
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
                if id.is_empty() || !seen.insert(id.clone()) {
                    continue;
                }
                hubo_nuevos = true;
                let paginas = value
                    .get("paginas")
                    .and_then(|v| v.as_i64())
                    .unwrap_or(1);
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
