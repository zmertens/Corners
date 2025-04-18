import express from "express";
import connectDatabase from "./config/database";
import setNavigations from "./routes/navigations";
import { loadWasm } from "./services/wasmLoader";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDatabase();

loadWasm()
  .then((instance) => {
    console.log("WASM instance loaded");
    if (instance) {
      console.log("WASM instance is ready");
      const r = 10;
      const c = 10;
      console.log(`${instance.stringify_from_dimens(r, c)}`);
    } else {
      console.error("Failed to load WASM instance");
    }
  })
  .catch((error) => {
    console.error("Error loading WASM instance:", error);
  });

setNavigations(app);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
