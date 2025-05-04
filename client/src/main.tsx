import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const title = "Tuma - Find Services in Liberia";
document.title = title;

createRoot(document.getElementById("root")!).render(<App />);
