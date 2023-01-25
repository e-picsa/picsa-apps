import React from 'react';
import { useRouter } from 'next/router';
import { useConfig } from 'nextra-theme-docs';

export default {
  project: {
    link: 'https://github.com/e-picsa/picsa-apps',
  },
  logo: <strong>PICSA Project</strong>,
  docsRepositoryBase: 'https://github.com/e-picsa/picsa-apps/pages',
  head: () => {
    const { asPath } = useRouter();
    const { frontMatter } = useConfig();
    return (
      <>
        <meta property="og:url" content={`https://picsa.app/${asPath}`} />
        <meta property="og:title" content={frontMatter.title || 'PICSA'} />
        <meta
          property="og:description"
          content={frontMatter.description || 'PICSA Web Docs'}
        />
      </>
    );
  },
  useNextSeoProps() {
    const { route } = useRouter();
    if (route !== '/') {
      return {
        titleTemplate: '%s – PICSA',
      };
    }
  },
  toc:{
    float: true,
    title: <strong>On this Page</strong>
  },
  darkMode: true,
  navigation: {
    prev: true,
    next: true
  },
  footer: {
    text: (
      <span>
        Copyright {new Date().getFullYear()} ©{' '}
        <a href="https://picsa.app" target="_blank" rel="noopener noreferrer">
          PICSA
        </a>
        .
      </span>
    ),
  },
};
