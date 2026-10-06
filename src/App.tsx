import { AppProviders } from '@/app/providers';
import { AppRoutes } from '@/app/routes';

function App() {
  return (
    //main
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}

export default App;
