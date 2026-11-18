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

fn upload_scan_file(path: &PathBuf, persona: &str, api: &str) -> bool {
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

        // La carpeta compartida ya tiene muchos archivos antiguos: se marcan
        // como enviados para subir solamente los escáneres nuevos.
        if solo_nuevos && folder.is_dir() {
            if let Ok(entries) = fs::read_dir(&folder) {
                for entry in entries.flatten() {
                    if entry.path().is_file() {
                        sent.insert(entry.file_name().to_string_lossy().to_string());
                    }
                }
                if let Ok(json) = serde_json::to_string(&sent.iter().collect::<Vec<_>>()) {
                    let _ = fs::write(&sent_path, json);
                }
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
                if upload_scan_file(&path, &persona, &api) {
                    sent.insert(name.clone());
                    if let Ok(json) = serde_json::to_string(&sent.iter().collect::<Vec<_>>()) {
                        let _ = fs::write(&sent_path, json);
                    }
                }
            }
        }
    });
}

fn sanitize_bat_value(value: &str) -> String {
    value
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.' | ':' | '/' | '@'))
        .collect()
}

#[tauri::command]
fn install_startup_script(
    server_url: String,
    pairing_code: String,
    pc_name: String,
) -> Result<(), String> {
    use std::env;
    let startup_dir = env::var("APPDATA")
        .map(|appdata| PathBuf::from(appdata).join("Microsoft").join("Windows").join("Start Menu").join("Programs").join("Startup"))
        .map_err(|e| format!("Failed to get APPDATA: {}", e))?;

    let safe_url = sanitize_bat_value(server_url.trim_end_matches('/'));
    let safe_code = sanitize_bat_value(&pairing_code);
    let safe_name = sanitize_bat_value(&pc_name);

    let heartbeat_script = format!(
        r#"@echo off
:loop
curl -s -X POST "{}/api/pc/heartbeat" -H "Content-Type: application/json" -d "{{\"pc_name\":\"{}\",\"pairing_code\":\"{}\"}}" > nul 2>&1
timeout /t 30 /nobreak > nul
goto loop"#,
        safe_url, safe_name, safe_code
    );

    let bat_path = startup_dir.join("impulsa_heartbeat.bat");
    fs::write(&bat_path, heartbeat_script).map_err(|e| e.to_string())?;

    let bat_full = bat_path.to_string_lossy().to_string();
    let vbs_script = format!(
        r#"Set WshShell = CreateObject("WScript.Shell")
WshShell.Run Chr(34) & "{}" & Chr(34), 0, False"#,
        bat_full
    );

    let vbs_path = startup_dir.join("impulsa_run.vbs");
    fs::write(&vbs_path, vbs_script).map_err(|e| e.to_string())?;

    Ok(())
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
            start_scan_watcher(data_dir);

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
