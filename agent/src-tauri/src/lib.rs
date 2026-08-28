use serde::{Deserialize, Serialize};
use std::fs;
use std::net::UdpSocket;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

struct AppState {
    window_visible: Mutex<bool>,
    app_handle: Mutex<Option<tauri::AppHandle>>,
}

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

    let heartbeat_script = format!(
        r#"@echo off
:loop
curl -s -X POST "{}/api/heartbeat" -H "Content-Type: application/json" -d "{{\"pc_name\":\"{}\",\"pairing_code\":\"{}\"}}" > nul 2>&1
timeout /t 30 /nobreak > nul
goto loop"#,
        server_url, pc_name, pairing_code
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
    if let Some(state) = app.try_state::<AppState>() {
        *state.window_visible.lock().unwrap() = false;
    }
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
        .manage(AppState {
            window_visible: Mutex::new(true),
            app_handle: Mutex::new(None),
        })
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let handle = app.handle().clone();
            {
                let state: tauri::State<AppState> = handle.state();
                *state.app_handle.lock().unwrap() = Some(handle.clone());
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

            let window_clone = window.clone();
            let state_handle = handle.clone();
            tray.on_menu_event(move |_app, event| {
                match event.id().as_ref() {
                    "show" => {
                        let app_state: tauri::State<AppState> = state_handle.state();
                        let mut visible = app_state.window_visible.lock().unwrap();
                        if *visible {
                            window_clone.hide().ok();
                            *visible = false;
                        } else {
                            window_clone.show().ok();
                            window_clone.set_focus().ok();
                            *visible = true;
                        }
                    }
                    "quit" => {
                        std::process::exit(0);
                    }
                    _ => {}
                }
            });

            let state_handle2 = handle.clone();
            tray.on_tray_icon_event(move |_tray, event| {
                if let tauri::tray::TrayIconEvent::Click { .. } = event {
                    let app_state: tauri::State<AppState> = state_handle2.state();
                    let mut visible = app_state.window_visible.lock().unwrap();
                    if *visible {
                        window.hide().ok();
                        *visible = false;
                    } else {
                        window.show().ok();
                        window.set_focus().ok();
                        *visible = true;
                    }
                }
            });

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
