use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager, WindowEvent,
};

const KEYRING_SERVICE: &str = "com.notionai.pet";
const KEYRING_USER: &str = "notion-integration-token";

/// 펫 오버레이 창 표시/숨김을 제어하고 변경 사항을 모든 창에 브로드캐스트한다.
#[tauri::command]
fn set_pet_visible(app: tauri::AppHandle, visible: bool) {
    if let Some(win) = app.get_webview_window("pet") {
        if visible {
            let _ = win.show();
        } else {
            let _ = win.hide();
        }
        let _ = app.emit("pet-visibility-changed", visible);
    }
}

#[tauri::command]
fn is_pet_visible(app: tauri::AppHandle) -> bool {
    app.get_webview_window("pet")
        .map(|w| w.is_visible().unwrap_or(false))
        .unwrap_or(false)
}

/// Notion 토큰을 OS 자격 증명 저장소(Windows Credential Manager)에 저장한다.
#[tauri::command]
fn save_token(token: String) -> Result<(), String> {
    keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER)
        .and_then(|e| e.set_password(&token))
        .map_err(|e| e.to_string())
}

/// 저장된 Notion 토큰을 불러온다. 없으면 None을 반환한다.
#[tauri::command]
fn load_token() -> Result<Option<String>, String> {
    match keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER) {
        Ok(entry) => match entry.get_password() {
            Ok(token) => Ok(Some(token)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(e) => Err(e.to_string()),
        },
        Err(e) => Err(e.to_string()),
    }
}

/// 저장된 Notion 토큰을 삭제한다.
#[tauri::command]
fn delete_token() -> Result<(), String> {
    match keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER) {
        Ok(entry) => match entry.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(e) => Err(e.to_string()),
        },
        Err(e) => Err(e.to_string()),
    }
}

/// 메인 창을 표시하고 포커스를 준다 (펫 우클릭 메뉴 '실행'용).
#[tauri::command]
fn show_main(app: tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_focus();
    }
}

/// 앱을 완전히 종료한다 (펫 우클릭 메뉴 '종료'용).
#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .invoke_handler(tauri::generate_handler![
            set_pet_visible,
            is_pet_visible,
            save_token,
            load_token,
            delete_token,
            show_main,
            quit_app
        ])
        .setup(|app| {
            let open_main = MenuItem::with_id(app, "open-main", "메인 화면 열기", true, None::<&str>)?;
            let toggle_pet = MenuItem::with_id(app, "toggle-pet", "펫 보이기/숨기기", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "종료", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_main, &toggle_pet, &quit])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("NotionAI Pet")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open-main" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.unminimize();
                            let _ = win.set_focus();
                        }
                    }
                    "toggle-pet" => {
                        if let Some(win) = app.get_webview_window("pet") {
                            let visible = win.is_visible().unwrap_or(false);
                            if visible {
                                let _ = win.hide();
                            } else {
                                let _ = win.show();
                            }
                            let _ = app.emit("pet-visibility-changed", !visible);
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        // 메인 창을 닫아도 앱은 트레이에 상주
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
