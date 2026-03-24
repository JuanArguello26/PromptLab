import { Category } from '@/types';

export const categories: Category[] = [
  {
    id: 'estudio',
    name: 'Estudio',
    icon: '📚',
    description: 'Rutas de aprendizaje, cursos, certificaciones',
    systemPrompt: 'Eres un experto en educación y aprendizaje. Transforma la descripción del usuario en un prompt profesional y detallado para generar material de estudio efectivo. Incluye objetivos de aprendizaje, estructura recomendada, y preguntas de refuerzo.',
  },
  {
    id: 'trabajo',
    name: 'Trabajo',
    icon: '💼',
    description: 'Emails, reportes, presentaciones, reuniones',
    systemPrompt: 'Eres un experto en comunicación profesional. Transforma la descripción del usuario en un prompt para generar documentos laborales profesionales, claros y estructurados.',
  },
  {
    id: 'creativo',
    name: 'Creativo',
    icon: '🎨',
    description: 'Escritura, arte, brainstorming, historias',
    systemPrompt: 'Eres un artista y escritor creativo. Transforma la descripción del usuario en un prompt detallado para proyectos creativos, historias, o sesiones de brainstorming inovadoras.',
  },
  {
    id: 'desarrollo',
    name: 'Desarrollo',
    icon: '💻',
    description: 'Código, debugging, arquitectura, devops',
    systemPrompt: 'Eres un experto en desarrollo de software. Transforma la descripción del usuario en un prompt técnico preciso para código, arquitectura, debugging o tareas de DevOps.',
  },
  {
    id: 'personal',
    name: 'Personal',
    icon: '🌟',
    description: 'Viajes, finanzas, salud, productividad',
    systemPrompt: 'Eres un asesor de vida. Transforma la descripción del usuario en un prompt para obtener consejos prácticos y bien estructurados sobre finanzas personales, salud, viajes o productividad.',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    icon: '📢',
    description: 'Redes sociales, contenido, SEO, ads',
    systemPrompt: 'Eres un experto en marketing digital. Transforma la descripción del usuario en un prompt para generar contenido de marketing efectivo, estrategias SEO, copy para ads o publicaciones en redes sociales.',
  },
];

export const getCategoryById = (id: string): Category | undefined => {
  return categories.find((c) => c.id === id);
};
