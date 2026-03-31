import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useTheme } from '@/theme/ThemeContext'

export function ToastHost() {
  const { theme } = useTheme()
  return (
    <ToastContainer
      position="top-right"
      autoClose={4500}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme}
      style={{ zIndex: 10050 }}
    />
  )
}
