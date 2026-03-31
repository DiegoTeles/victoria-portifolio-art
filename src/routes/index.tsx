import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { HomePage } from '../pages/HomePage'
import { AboutPage } from '../pages/AboutPage'
import { ContactPage } from '../pages/ContactPage'
import { AdminPage } from '../pages/AdminPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 's/:imageId', element: <HomePage /> },
      { path: 'movies', element: <HomePage /> },
      { path: 'sobre', element: <AboutPage /> },
      { path: 'contato', element: <ContactPage /> },
      { path: 'admin', element: <AdminPage /> },
    ],
  },
])

export function Routes() {
  return <RouterProvider router={router} />
}
