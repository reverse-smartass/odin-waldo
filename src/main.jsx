import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App2.jsx'
import Leaderboard from './Leaderboard.jsx'
import { createBrowserRouter , RouterProvider} from "react-router";
import { Navigate } from "react-router";

const routes = [
  {
    path: "/",
    element: <App/>,
  },
  {
    path: "/leaderboard",
    element: <Leaderboard />,
  },
];

const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
