import { RouterProvider } from "@tanstack/react-router";
import { appRouter } from "./routes";

export function App() {
  return <RouterProvider router={appRouter} />;
}
