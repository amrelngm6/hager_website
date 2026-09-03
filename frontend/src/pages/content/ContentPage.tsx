import { useState } from 'react';
import {
  Settings2,
  Sparkles,
  User,
  Wrench,
  FolderKanban,
  Building2,
  Mail,
  Heart,
  CalendarDays,
  FileText,
  GraduationCap,
  Briefcase,
  Trophy,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { GeneralEditor }    from './sections/GeneralEditor';
import { IntroEditor }      from './sections/IntroEditor';
import { AboutEditor }      from './sections/AboutEditor';
import { SkillsEditor }     from './sections/SkillsEditor';
import { ProjectsEditor }   from './sections/ProjectsEditor';
import { ClientsEditor }    from './sections/ClientsEditor';
import { ContactEditor }    from './sections/ContactEditor';
import { GenericFlowEditor } from './sections/GenericFlowEditor';
import './content.css';

// ---------------------------------------------------------------------------
// Section tab definitions
// ---------------------------------------------------------------------------

const sections = [
  {
    key: 'general',
    label: 'General',
    icon: Settings2,
    description: 'Site-wide settings — name, skins, avatar, texts.',
    component: <GeneralEditor />,
  },
  {
    key: 'intro',
    label: 'Intro Screen',
    icon: Sparkles,
    description: 'Hero section: greeting, name, title, quote, avatar, buttons.',
    component: <IntroEditor />,
  },
  {
    key: 'about',
    label: 'About',
    icon: User,
    description: 'Bio text, stats/highlights, and navigation buttons.',
    component: <AboutEditor />,
  },
  {
    key: 'skills',
    label: 'Skills',
    icon: Wrench,
    description: 'Skill categories with items and star ratings.',
    component: <SkillsEditor />,
  },
  {
    key: 'projects',
    label: 'Projects',
    icon: FolderKanban,
    description: 'Portfolio projects — supports image, gallery, YouTube & video.',
    component: <ProjectsEditor />,
  },
  {
    key: 'clients',
    label: 'Clients',
    icon: Building2,
    description: 'Client logos and intro text.',
    component: <ClientsEditor />,
  },
  {
    key: 'contact',
    label: 'Contact',
    icon: Mail,
    description: 'Email, phone, social links, and action buttons.',
    component: <ContactEditor />,
  },
  {
    key: 'hobbies',
    label: 'Hobbies',
    icon: Heart,
    description: 'Personal interests and hobbies flow.',
    component: <GenericFlowEditor sectionKey="hobbies" />,
  },
  {
    key: 'age',
    label: 'Age',
    icon: CalendarDays,
    description: 'Age / birthdate answer flow.',
    component: <GenericFlowEditor sectionKey="age" />,
  },
  {
    key: 'cv',
    label: 'CV / Resume',
    icon: FileText,
    description: 'CV download flow and button.',
    component: <GenericFlowEditor sectionKey="cv" />,
  },
  {
    key: 'education',
    label: 'Education',
    icon: GraduationCap,
    description: 'Education / university answer flow.',
    component: <GenericFlowEditor sectionKey="education" />,
  },
  {
    key: 'experience',
    label: 'Experience',
    icon: Briefcase,
    description: 'Career / work experience answer flow.',
    component: <GenericFlowEditor sectionKey="experience" />,
  },
  {
    key: 'awards',
    label: 'Awards',
    icon: Trophy,
    description: 'Certifications, courses, and awards list.',
    component: <GenericFlowEditor sectionKey="awards" />,
  },
  {
    key: 'hello',
    label: 'Greeting',
    icon: MessageCircle,
    description: 'Response shown when user says hi/hello.',
    component: <GenericFlowEditor sectionKey="hello" />,
  },
  {
    key: 'msg_success',
    label: 'Success Message',
    icon: CheckCircle2,
    description: 'Message shown after a contact form is submitted.',
    component: <GenericFlowEditor sectionKey="msg_success" />,
  },
  {
    key: 'error',
    label: 'Error / Fallback',
    icon: AlertCircle,
    description: 'Shown when the chat cannot match any command.',
    component: <GenericFlowEditor sectionKey="error" />,
  },
];

// ---------------------------------------------------------------------------
// ContentPage
// ---------------------------------------------------------------------------

export function ContentPage() {
  const [activeKey, setActiveKey] = useState('general');

  const active = sections.find((s) => s.key === activeKey)!;

  return (
    <div className="content-page">
      {/* Header */}
      <div className="content-page-header">
        <h1>Content Manager</h1>
        <p>Edit every section of your portfolio template. Changes are saved to the database and reflected live on the site.</p>
      </div>

      <div className="content-layout">
        {/* Section sidebar */}
        <nav className="section-nav">
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`section-nav-item ${activeKey === key ? 'active' : ''}`}
              onClick={() => setActiveKey(key)}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Editor area */}
        <div className="editor-area">
          <div className="editor-area-header">
            <active.icon size={18} />
            <div>
              <h2>{active.label}</h2>
              <p>{active.description}</p>
            </div>
          </div>
          <div className="editor-area-body">
            {active.component}
          </div>
        </div>
      </div>
    </div>
  );
}
