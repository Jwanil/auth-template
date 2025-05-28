import './App.css';
import SignIn from './SignIn';
import SignUp from './SignUp';
import Welcome from './Welcome';
import Admin from './Admin';
import ResetPassword from './ResetPassword'; // Add this import
import { createBrowserRouter, RouterProvider } from "react-router-dom";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <SignUp />, // Change this to SignUp
    },
    {
      path: "/SignIn",
      element: <SignIn />,
    },
    {
      path: "/SignUp",
      element: <SignUp />,
    },
    {
      path: "/welcome",
      element: <Welcome />,
    },
    {
      path: "/admin",
      element: <Admin />,
    },
    {
      path: "/reset-password",
      element: <ResetPassword />,
    },
    {
      path: "/reset-password/:token",
      element: <ResetPassword />,
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;