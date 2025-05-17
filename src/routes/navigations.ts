import { Application } from "express";
import { authenticate } from "../middleware/auth";
import * as authController from "../controllers/authController";
import * as mazeController from "../controllers/mazeController";

const setNavigations = (app: Application) => {
  // Base route
  app.get("/", (req, res) => {
    res.send("Welcome to Corners API");
  });

  // Auth routes
  app.post("/login", (req, res, next) => {
    Promise.resolve(authController.login(req, res)).catch(next);
  });
  app.post("/logout", authController.logout);
  app.post("/register", (req, res, next) => {
    Promise.resolve(authController.register(req, res)).catch(next);
  });
  app.post("/forgot-password", (req, res, next) => {
    Promise.resolve(authController.forgotPassword(req, res)).catch(next);
  });
  app.post("/reset-password", (req, res, next) => {
    Promise.resolve(authController.resetPassword(req, res)).catch(next);
  });

  // Maze routes - these need to come before more generic user/:id routes to avoid conflicts
  app.get("/user/mazes", authenticate as any, mazeController.getUserMazes);
  app.post("/user/maze", authenticate as any, mazeController.createMaze);
  app.get("/user/maze/:id", authenticate as any, mazeController.getMazeById);
  app.put("/user/maze/:id", authenticate as any, mazeController.updateMaze);
  app.delete("/user/maze/:id", authenticate as any, mazeController.deleteMaze);

  // User routes
  app.get("/users", authenticate as any, authController.getAllUsers);
  app.get("/user/:id", authenticate as any, (req, res, next) => {
    Promise.resolve(authController.getUserById(req, res)).catch(next);
  });
  app.delete("/user/:id", authenticate as any, (req, res, next) => {
    Promise.resolve(authController.deleteUser(req, res)).catch(next);
  });
};

export default setNavigations;
