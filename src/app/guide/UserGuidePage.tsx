import { Activity, ArrowLeft, ExternalLink, FileText, GitBranch } from 'lucide-react';
import { useEffect } from 'react';
import { usePersistedTheme } from '../theme';
import { SiteHeader, ThemeToggle } from '../ui';
import { GuideContent, guideNavigation } from './GuideContent';

const repositoryUrl = 'https://github.com/danielemasone/enterprise-data-workbench';
const pagesBasePath = import.meta.env.BASE_URL;

const guideResources = [
  {
    label: 'API documentation',
    href: `${pagesBasePath}docs/`,
    icon: FileText,
    external: false,
  },
  {
    label: 'Coverage report',
    href: `${pagesBasePath}coverage/`,
    icon: Activity,
    external: false,
  },
  {
    label: 'GitHub repository',
    href: repositoryUrl,
    icon: GitBranch,
    external: true,
  },
] as const;

/** Published end-user documentation rendered with the portfolio application design system. */
export function UserGuidePage() {
  const [theme, setTheme] = usePersistedTheme();
  useGuideMetadata();

  return (
    <div className="app-shell guide-shell" data-theme={theme}>
      <a className="skip-link" href="#guide-content">
        Skip to guide content
      </a>
      <SiteHeader
        title="Enterprise Data Workbench User Guide"
        subtitle="Product workflows, local-first mechanics and accessibility"
        actions={
          <>
            <a className="header-link" href={pagesBasePath}>
              <ArrowLeft size={16} aria-hidden="true" />
              Workbench
            </a>
            <ThemeToggle
              theme={theme}
              onToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            />
          </>
        }
      />

      <main id="guide-content" className="guide-main">
        <section className="guide-hero" aria-labelledby="guide-title">
          <div>
            <span className="eyebrow">Published product documentation</span>
            <h2 id="guide-title">Operate the workbench with confidence.</h2>
            <p>
              Follow the shared workspace from inline editing through optimistic persistence, mock
              synchronization and explicit conflict resolution.
            </p>
          </div>
          <nav className="guide-resource-nav" aria-label="Documentation resources">
            {guideResources.map(({ label, href, icon: Icon, external }) => (
              <a
                key={label}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
                {external ? <ExternalLink size={14} aria-hidden="true" /> : null}
              </a>
            ))}
          </nav>
        </section>

        <div className="guide-layout">
          <aside className="guide-sidebar">
            <nav aria-label="User guide contents">
              <strong>On this page</strong>
              <ol>
                {guideNavigation.map(([id, label]) => (
                  <li key={id}>
                    <a href={`#${id}`}>{label}</a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
          <GuideContent />
        </div>
      </main>
    </div>
  );
}

function useGuideMetadata(): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'User Guide | Enterprise Data Workbench';
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.getAttribute('content');
    description?.setAttribute(
      'content',
      'User guide for Enterprise Data Workbench workflows, keyboard UX, synchronization and conflict resolution.',
    );

    return () => {
      document.title = previousTitle;
      if (description && previousDescription !== undefined && previousDescription !== null) {
        description.setAttribute('content', previousDescription);
      }
    };
  }, []);
}
