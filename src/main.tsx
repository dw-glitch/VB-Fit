import {createRoot} from 'react-dom/client';
import App,{ErrorBoundary} from './app/App';
import './styles.css';
createRoot(document.getElementById('root')!).render(<ErrorBoundary><App/></ErrorBoundary>);
if('serviceWorker' in navigator&&import.meta.env.PROD)window.addEventListener('load',()=>{void navigator.serviceWorker.register('/sw.js').catch(()=>{});});
