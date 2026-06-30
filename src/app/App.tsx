import { BrowserRouter } from 'react-router-dom';
import { SessionProvider } from '@/app/providers/session';
import { AppRouter } from '@/app/router/AppRouter';

function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <SessionProvider>
        <AppRouter />
      </SessionProvider>
    </BrowserRouter>
  );
}

export default App;
