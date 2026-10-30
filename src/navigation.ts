import { useEffect, useState } from 'react';

type Entry = { linkOnNavigation: true; index: number; route: string };
const route = () => location.hash.slice(1) || '/';
const entry = (): Entry | undefined => history.state?.linkOnNavigation ? history.state : undefined;

// Keep in-app Back within this demo, including links opened directly in a new tab.
export function initializeNavigation() {
  history.scrollRestoration = 'manual';
  if (entry()?.route === route()) return;
  const requested = route();
  history.replaceState({ linkOnNavigation: true, index: 0, route: '/' }, '', '#/');
  if (requested !== '/') history.pushState({ linkOnNavigation: true, index: 1, route: requested }, '', `#${requested}`);
}

export function useNavigation() {
  const [hash, setHash] = useState(route);
  useEffect(() => {
    const sync = () => setHash(route());
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => { window.removeEventListener('popstate', sync); window.removeEventListener('hashchange', sync); };
  }, []);
  const go = (next: string, replace = false) => {
    if (next === route()) return;
    const index = entry()?.index || 0;
    const nextEntry: Entry = { linkOnNavigation: true, index: index + (replace ? 0 : 1), route: next };
    if (replace) history.replaceState(nextEntry, '', `#${next}`);
    else history.pushState(nextEntry, '', `#${next}`);
    setHash(next);
  };
  const home = () => {
    const index = entry()?.index || 0;
    if (index > 0) history.go(-index);
    else go('/', true);
  };
  const back = () => (entry()?.index || 0) > 0 ? history.back() : home();
  return { hash, go, home, back };
}
