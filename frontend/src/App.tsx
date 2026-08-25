import { AppProvider } from './context/AppContext'
import { AppShell } from './components/AppShell'

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
