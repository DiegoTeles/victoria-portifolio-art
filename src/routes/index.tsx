import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { AdminLayout } from '../components/admin/AdminLayout'
import { HomePage } from '../pages/HomePage'
import { AboutPage } from '../pages/AboutPage'
import { ContactPage } from '../pages/ContactPage'
import { AdminLoginPage } from '../pages/AdminLoginPage'
import { AdminArtworksPage } from '../pages/AdminPage'
import { AdminCategoriesPage } from '../pages/AdminCategoriesPage'
import { AdminSubcategoriesPage } from '../pages/AdminSubcategoriesPage'
import { AdminBioPage } from '../pages/AdminBioPage'
import { AdminCurriculumPage } from '../pages/AdminCurriculumPage'
import { AdminSocialPage } from '../pages/AdminSocialPage'

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
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminLoginPage /> },
      { path: 'obras', element: <AdminArtworksPage /> },
      { path: 'categorias', element: <AdminCategoriesPage /> },
      { path: 'subcategorias', element: <AdminSubcategoriesPage /> },
      { path: 'bio', element: <AdminBioPage /> },
      { path: 'redes', element: <AdminSocialPage /> },
      { path: 'curriculo', element: <AdminCurriculumPage /> },
    ],
  },
])

export function Routes() {
  return <RouterProvider router={router} />
}
