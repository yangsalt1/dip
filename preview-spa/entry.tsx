import React from 'react';
import { createRoot } from 'react-dom/client';
import '../app/globals.css';
import HomePage from '../app/page';
import EtfPage from '../app/etf/page';
import EtfDetail from '../app/etf/[id]/page';
import StoryPage from '../app/story/[id]/page';
import FxPage from '../app/fx/page';
import MoneyPage from '../app/money/page';

const root = createRoot(document.getElementById('root')!);
async function route() {
  const h = (location.hash || '#home').slice(1);
  const i = h.indexOf('-');
  const sec = i < 0 ? h : h.slice(0, i);
  const id = i < 0 ? '' : h.slice(i + 1);
  let el: React.ReactNode;
  try {
    if (sec === 'etf' && id) el = await (EtfDetail as any)({ params: Promise.resolve({ id }) });
    else if (sec === 'etf') el = <EtfPage />;
    else if (sec === 'story') el = await (StoryPage as any)({ params: Promise.resolve({ id }) });
    else if (sec === 'fx') el = <FxPage />;
    else if (sec === 'money') el = <MoneyPage />;
    else el = <HomePage />;
  } catch { el = <HomePage />; }
  const changed = (route as any).last !== h; (route as any).last = h;
  root.render(<React.Fragment key={h}>{el}</React.Fragment>);
  if (changed) window.scrollTo(0, 0);

}

window.addEventListener('hashchange', route);
route();
