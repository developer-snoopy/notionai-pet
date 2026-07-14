import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import MainWindow from "./windows/MainWindow";
import PetWindow from "./windows/PetWindow";
import "./App.css";

function App() {
  const label = getCurrentWebviewWindow().label;
  return label === "pet" ? <PetWindow /> : <MainWindow />;
}

export default App;
