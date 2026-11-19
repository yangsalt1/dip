import React from 'react';
export function toHash(href: string) {
  const h = href.replace(/^\//, '').replace(/\/$/, '');
  return h ? h.replace(/\//g, '-') : 'home';
}
export default function Link({ href, children, ...rest }: any) {
  return <a href={'#' + toHash(String(href))} {...rest}>{children}</a>;
}
export function notFound(): never { throw new Error('not found'); }
export function usePathname() { return '/'; }
