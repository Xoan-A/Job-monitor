import type { Job, JobStatus } from '../../types'

export const PROFILE_SKILLS = ['C#', '.NET', 'ASP.NET', 'SQL Server', 'PostgreSQL', 'Docker', 'Git', 'REST', 'Python', 'JavaScript', 'TypeScript', 'React']

const HOUR = 60 * 60 * 1000

function ago(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * HOUR).toISOString()
}

interface MockSeed {
  id: number
  source: 'buscojobs' | 'jooble'
  title: string
  company: string | null
  confidential?: boolean
  city: string
  department: string
  country: string
  remoteLabel: string
  employmentType: string | null
  salary: string | null
  skills: string[]
  experienceLevel: string | null
  hoursAgo: number
  summary: string
  body: [string[], string[]]
}

const SEEDS: MockSeed[] = [
  {
    id: 101, source: 'buscojobs', title: 'Software Engineer .NET', company: 'dLocal',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Híbrido',
    employmentType: 'Full-time', salary: '$80.000 - $110.000',
    skills: ['C#', '.NET', 'ASP.NET', 'PostgreSQL', 'Docker', 'REST'],
    experienceLevel: 'Mid / Senior', hoursAgo: 4,
    summary: 'Unete al equipo de pagos de dLocal para construir y escalar servicios financieros de alto volumen usados en mas de 40 paises.',
    body: [
      ['Sobre el rol', 'Formaras parte del equipo de Payments Engineering, responsable de las APIs que procesan miles de transacciones por minuto. Trabajo coordinado con producto, QA y operaciones siguiendo practicas de CI/CD.'],
      ['- 3+ anios de experiencia con C# y .NET\n- Experiencia con PostgreSQL o SQL Server\n- Conocimientos de Docker y pipelines CI/CD\n- Deseable: experiencia en fintech o pagos\n- Ingles tecnico intermedio'],
    ],
  },
  {
    id: 102, source: 'jooble', title: 'Backend Developer Python', company: 'Mercado Libre (via consultora)',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Remoto',
    employmentType: 'Full-time', salary: null,
    skills: ['Python', 'Django', 'PostgreSQL', 'REST', 'Docker', 'AWS'],
    experienceLevel: 'Mid', hoursAgo: 9,
    summary: 'Desarrollo de servicios backend para logistica y fulfillment integrando sistemas internos con partners externos.',
    body: [
      ['La posicion', 'Integraras un equipo distribuido que mantiene los servicios de tracking de envios. El stack principal es Python/Django sobre PostgreSQL, desplegado en AWS con Docker.'],
      ['- 2+ anios con Python web frameworks\n- APIs REST y colas de mensajes\n- SQL avanzado\n- Metodologias agiles'],
    ],
  },
  {
    id: 103, source: 'buscojobs', title: 'Analista Programador C#', company: null, confidential: true,
    city: 'Canelones', department: 'Canelones', country: 'Uruguay', remoteLabel: 'Presencial',
    employmentType: 'Full-time', salary: '$55.000 - $70.000',
    skills: ['C#', '.NET', 'SQL Server', 'Angular', 'Git'],
    experienceLevel: 'Junior / Mid', hoursAgo: 26,
    summary: 'Empresa industrial busca analista programador para evolutivos y soporte de sistemas de gestion interna.',
    body: [
      ['Descripcion del puesto', 'Mantenimiento y desarrollo de nuevas funcionalidades sobre ERP propio. Trabajo coordenado con el area de procesos y usuarios clave.'],
      ['- Tecnicado o estudiante avanzado en IT\n- C# y .NET (WebForms o .NET Core)\n- SQL Server\n- Se valora Angular'],
    ],
  },
  {
    id: 104, source: 'jooble', title: 'Frontend Developer React', company: 'UruIT',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Híbrido',
    employmentType: 'Full-time', salary: 'USD 2.500 - USD 3.500',
    skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'REST', 'Git'],
    experienceLevel: 'Mid', hoursAgo: 31,
    summary: 'Construccion de interfaces para clientes de EE.UU. en productos SaaS B2B, con fuerte foco en calidad de codigo.',
    body: [
      ['About the role', 'Join a product team building dashboards and workflow tools used by logistics companies. You will own features end-to-end alongside US-based designers and PMs.'],
      ['- Solid React + TypeScript experience\n- Testing culture (Jest, RTL)\n- English communication skills\n- Nice to have: Next.js'],
    ],
  },
  {
    id: 105, source: 'buscojobs', title: 'DevOps Engineer', company: 'Globant',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Teletrabajo',
    employmentType: 'Full-time', salary: null,
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux'],
    experienceLevel: 'Senior', hoursAgo: 47,
    summary: 'Implementacion y operacion de infraestructura cloud para proyectos internacionales.',
    body: [
      ['El desafio', 'Automatizar despliegues, monitoreo y escalado de aplicaciones en AWS usando Terraform y Kubernetes.'],
      ['- 4+ anios en roles DevOps/SRE\n- AWS certificado deseable\n- IaC con Terraform\n- Scripting Bash/Python'],
    ],
  },
  {
    id: 106, source: 'buscojobs', title: 'Analista de Datos SQL', company: 'State Street',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Híbrido',
    employmentType: 'Full-time', salary: '$60.000 - $75.000',
    skills: ['SQL', 'Power BI', 'Excel', 'Python'],
    experienceLevel: 'Junior / Mid', hoursAgo: 52,
    summary: 'Elaboracion de reportes regulatorios y analisis de datos financieros para clientes internacionales.',
    body: [
      ['Responsabilidades', 'Preparar data sets, validar integridad de datos y construir reportes periodicos con Power BI apoyandose en SQL sobre grandes volumenes.'],
      ['- SQL intermedio/avanzado\n- Excel avanzado\n- Power BI valorado\n- Ingles intermedio (reportes en ingles)'],
    ],
  },
  {
    id: 107, source: 'jooble', title: 'Desarrollador Java Spring Boot', company: 'Isbel',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Presencial',
    employmentType: 'Full-time', salary: '$65.000 - $85.000',
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'REST', 'Docker'],
    experienceLevel: 'Mid', hoursAgo: 74,
    summary: 'Desarrollo de plataforma de gestion documental para sector salud.',
    body: [
      ['El proyecto', 'Nueva version de la suite de historia clinica digital. Backend en Java 17 + Spring Boot con arquitectura hexagonal.'],
      ['- 3+ anios de Java\n- Spring Boot, JPA\n- PostgreSQL\n- Buenas practicas: testing, code review'],
    ],
  },
  {
    id: 108, source: 'buscojobs', title: 'QA Automation Engineer', company: 'Qubika',
    city: 'Maldonado', department: 'Maldonado', country: 'Uruguay', remoteLabel: 'Teletrabajo',
    employmentType: 'Full-time', salary: null,
    skills: ['Selenium', 'Cypress', 'TypeScript', 'API Testing', 'Git'],
    experienceLevel: 'Mid', hoursAgo: 96,
    summary: 'Disenio y ejecucion de suites automatizadas para aplicaciones web de clientes de la region.',
    body: [
      ['Tu rol', 'Crear y mantener frameworks de automatizacion E2E y de API, participando en ceremonias agiles con equipos de desarrollo.'],
      ['- Experiencia con Cypress o Selenium\n- TypeScript/JavaScript\n- Consumo y prueba de APIs REST'],
    ],
  },
  {
    id: 109, source: 'buscojobs', title: 'Administrador de Base de Datos', company: 'Republica Afap',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Presencial',
    employmentType: 'Full-time', salary: '$70.000 - $90.000',
    skills: ['SQL Server', 'T-SQL', 'Backup', 'Performance Tuning', 'Windows Server'],
    experienceLevel: 'Senior', hoursAgo: 120,
    summary: 'Administracion de instancias SQL Server criticas, tuning y politicas de backup y seguridad.',
    body: [
      ['Funciones', 'Garantizar disponibilidad y performance del parque de bases de datos corporativas, planificar capacity y aplicar politicas de seguridad.'],
      ['- 5+ anios administrando SQL Server\n- AlwaysOn / replicacion\n- Monitoreo y tuning de consultas'],
    ],
  },
  {
    id: 110, source: 'jooble', title: 'Full Stack Developer (.NET + React)', company: 'Chico.io',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Remoto',
    employmentType: 'Part-time', salary: 'USD 1.800 - USD 2.400',
    skills: ['C#', '.NET', 'React', 'TypeScript', 'SQL Server', 'REST'],
    experienceLevel: 'Mid', hoursAgo: 8,
    summary: 'Producto propio de e-commerce: desarrollo full stack de nuevas features y mejoras de performance.',
    body: [
      ['The opportunity', 'Small product team shipping weekly. You will work across the stack: .NET APIs, React frontend and SQL Server database.'],
      ['- 2+ years full stack experience\n- C#/.NET Core\n- React\n- Bonus: Stripe or payments integration'],
    ],
  },
  {
    id: 111, source: 'buscojobs', title: 'Desarrollador Web PHP Laravel', company: 'Estudio Digital Sur',
    city: 'Canelones', department: 'Canelones', country: 'Uruguay', remoteLabel: 'Híbrido',
    employmentType: 'Full-time', salary: '$45.000 - $58.000',
    skills: ['PHP', 'Laravel', 'MySQL', 'Vue', 'Git'],
    experienceLevel: 'Junior / Mid', hoursAgo: 150,
    summary: 'Desarrollo de sitios y aplicaciones web para pymes y emprendimientos locales.',
    body: [
      ['Buscamos', 'Persona prolija y autogestiva para mantener el portafolio de proyectos web del estudio, desde e-commerce hasta landing complejas.'],
      ['- PHP orientado a objetos\n- Laravel deseable\n- MySQL y Git\n- Vue.js valorado'],
    ],
  },
  {
    id: 112, source: 'buscojobs', title: 'Data Engineer Junior', company: 'Equifax Uruguay',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Híbrido',
    employmentType: 'Full-time', salary: null,
    skills: ['Python', 'SQL', 'ETL', 'Airflow', 'AWS'],
    experienceLevel: 'Junior', hoursAgo: 168,
    summary: 'Apoyo en construccion de pipelines de ingesta y transformacion de datos para modelos de riesgo.',
    body: [
      ['Que haras', 'Colaborar en el mantenimiento de DAGs de Airflow, optimizar queries y documentar fuentes de datos.'],
      ['- Estudiante avanzado o recien graduado\n- Python y SQL solidos\n- Conceptos de modelado dimensional'],
    ],
  },
  {
    id: 113, source: 'jooble', title: 'Mobile Developer Flutter', company: 'GeoPagos',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Teletrabajo',
    employmentType: 'Full-time', salary: '$75.000 - $95.000',
    skills: ['Flutter', 'Dart', 'REST', 'Firebase', 'Git'],
    experienceLevel: 'Mid / Senior', hoursAgo: 192,
    summary: 'Evolucion de la app de pagos con mas de 300 mil descargas, enfocada en estabilidad y nuevas funciones.',
    body: [
      ['El rol', 'Trabajaras en la app principal de la compania: releases quincenales, analytics y A/B testing continuo.'],
      ['- 2+ anios con Flutter en produccion\n- Integraciones REST seguras\n- Publicacion en stores'],
    ],
  },
  {
    id: 114, source: 'buscojobs', title: 'Soporte Tecnico IT', company: 'Tata Consultancy Services',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Presencial',
    employmentType: 'Full-time', salary: '$32.000 - $40.000',
    skills: ['Windows', 'Linux', 'Redes', 'Help Desk'],
    experienceLevel: 'Junior', hoursAgo: 216,
    summary: 'Atencion de incidentes N1/N2 para clientes corporativos, con plan de carrera hacia infraestructura.',
    body: [
      ['Detalles', 'Turnos rotativos en sitio cliente Zonamerica. Documentacion de casos y escalamiento a niveles superiores.'],
      ['- Conocimientos basicos de redes\n- Windows/Linux\n- Ingles basico\n- Orientacion al servicio'],
    ],
  },
  {
    id: 115, source: 'buscojobs', title: 'Arquitecto de Soluciones Cloud', company: 'NTT Data',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Remoto',
    employmentType: 'Contract', salary: null,
    skills: ['Azure', 'Arquitectura', '.NET', 'Kubernetes', 'Seguridad'],
    experienceLevel: 'Senior', hoursAgo: 240,
    summary: 'Definicion de arquitecturas cloud para clientes enterprise de la region sur de Latinoamerica.',
    body: [
      ['Rol', 'Liderar disenos de solucion, estimar esfuerzos y acompaniar a equipos de implementacion en decisiones tecnicas.'],
      ['- 6+ anios de experiencia IT\n- Certificacion Azure Solutions Architect\n- Background .NET valorado'],
    ],
  },
  {
    id: 116, source: 'jooble', title: 'Desarrolladora Frontend Angular', company: 'Praxia Labs',
    city: 'Remote - Uruguay', department: 'Todo el pais', country: 'Uruguay', remoteLabel: 'Remoto',
    employmentType: 'Full-time', salary: '$60.000 - $80.000',
    skills: ['Angular', 'TypeScript', 'RxJS', 'SCSS', 'REST'],
    experienceLevel: 'Mid', hoursAgo: 264,
    summary: 'Migracion progresiva de portal legado hacia Angular 17 con nuevo design system interno.',
    body: [
      ['Sobre el proyecto', 'Modernizacion de un portal financiero con alta concurrencia. Trabajo 100% remoto dentro de Uruguay.'],
      ['- 2+ anios con Angular\n- Manejo de RxJS\n- Consumo de APIs REST\n- Accesibilidad y responsive design'],
    ],
  },
  {
    id: 117, source: 'buscojobs', title: 'Tester QA Manual Semi Senior', company: 'Infocorp',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Presencial',
    employmentType: 'Full-time', salary: null,
    skills: ['Testing Manual', 'Jira', 'SQL', 'Postman'],
    experienceLevel: 'Mid', hoursAgo: 288,
    summary: 'Ejecucion de planes de prueba funcionales para productos gubernamentales de firma digital.',
    body: [
      ['Tareas', 'Disenar casos de prueba, ejecutar regresiones y registrar defectos con detalle reproducible. Coordinacion directa con desarrolladores.'],
      ['- 2 anios de experiencia en QA\n- Jira / manejo de defectos\n- SQL basico para validaciones'],
    ],
  },
  {
    id: 118, source: 'jooble', title: 'Machine Learning Engineer', company: 'PedidosYa',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Híbrido',
    employmentType: 'Full-time', salary: null,
    skills: ['Python', 'ML', 'PyTorch', 'Airflow', 'GCP', 'SQL'],
    experienceLevel: 'Senior', hoursAgo: 320,
    summary: 'Modelos de recomendacion y pricing dinamico para la plataforma de delivery lider en la region.',
    body: [
      ['The role', 'Productionize ML models serving millions of predictions per day. Close collaboration with data science and platform teams.'],
      ['- Strong Python engineering skills\n- Experience deploying models to production\n- GCP stack preferred'],
    ],
  },
  {
    id: 119, source: 'buscojobs', title: 'Desarrollador ABAP SAP', company: 'Waldo SA',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Híbrido',
    employmentType: 'Full-time', salary: '$80.000 - $100.000',
    skills: ['ABAP', 'SAP', 'SQL'],
    experienceLevel: 'Mid / Senior', hoursAgo: 360,
    summary: 'Soporte y desarrollos ABAP sobre SAP ECC para empresa lider en distribucion mayorista.',
    body: [
      ['Funciones', 'Analisis funcional-tecnico de pedidos internos, programacion ABAP y pruebas unitarias.'],
      ['- 3+ anios ABAP\n- Modulos SD/MM\n- Disponibilidad para horario extendido en cierres'],
    ],
  },
  {
    id: 120, source: 'buscojobs', title: 'Pasante Desarrollo de Software', company: 'GeneXus Consulting',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Presencial',
    employmentType: 'Internship', salary: '$20.000',
    skills: ['SQL', 'Git', 'Programacion'],
    experienceLevel: 'Estudiante', hoursAgo: 384,
    summary: 'Pasantia part-time para estudiantes de carreras IT con intencion de crecer dentro del equipo.',
    body: [
      ['Que ofrecemos', 'Mentoria de senior, participacion en proyectos reales desde el primer dia y posibilidad de efectivizacion.'],
      ['- Ser estudiante de IT\n- Conocimientos basicos de SQL y Git\n- 20 horas semanales'],
    ],
  },
  {
    id: 121, source: 'jooble', title: 'Site Reliability Engineer', company: 'Auth0 (Okta)',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Remoto',
    employmentType: 'Full-time', salary: 'USD 4.000 - USD 5.500',
    skills: ['Go', 'Kubernetes', 'AWS', 'Observability', 'Terraform'],
    experienceLevel: 'Senior', hoursAgo: 420,
    summary: 'Keep one of the largest identity platforms on the internet fast and reliable. Remote within Uruguay.',
    body: [
      ['What you will do', 'Own reliability targets, build automation for incident response, and reduce operational toil across services.'],
      ['- 5+ years in SRE/backend roles\n- Go or strong systems language\n- Deep Kubernetes experience'],
    ],
  },
  {
    id: 122, source: 'buscojobs', title: 'Analista Funcional Sr.', company: 'Deloitte Uruguay',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Híbrido',
    employmentType: 'Full-time', salary: null,
    skills: ['Analisis funcional', 'Requirements', 'SQL', 'Ingles'],
    experienceLevel: 'Senior', hoursAgo: 480,
    summary: 'Levantamiento de requerimientos y especificacion funcional para proyectos bancarios regionales.',
    body: [
      ['Responsabilidades', 'Interactuar con stakeholders, elaborar especificaciones y dar soporte a equipos de desarrollo durante todo el ciclo.'],
      ['- 4+ anios como analista funcional\n- Sector financiero valorado\n- Ingles avanzado'],
    ],
  },
  {
    id: 123, source: 'jooble', title: 'WordPress Developer', company: 'Agencia Mvd',
    city: 'Punta del Este', department: 'Maldonado', country: 'Uruguay', remoteLabel: 'Híbrido',
    employmentType: 'Freelance', salary: null,
    skills: ['WordPress', 'PHP', 'CSS', 'SEO'],
    experienceLevel: 'Junior / Mid', hoursAgo: 520,
    summary: 'Mantenimiento y desarrollo de sitios corporativos en WordPress para clientes de turismo y bienes raices.',
    body: [
      ['Buscamos', 'Freelancer confiable para proyectos recurrentes: nuevos sitios, optimizacion y actualizaciones.'],
      ['- WordPress themes/plugins\n- CSS y maquetacion responsiva\n- SEO tecnico basico'],
    ],
  },
  {
    id: 124, source: 'buscojobs', title: 'Lider Tecnico .NET', company: 'CPA Ferial',
    city: 'Montevideo', department: 'Montevideo', country: 'Uruguay', remoteLabel: 'Híbrido',
    employmentType: 'Full-time', salary: '$100.000 - $130.000',
    skills: ['C#', '.NET', 'ASP.NET', 'SQL Server', 'Azure DevOps', 'Docker'],
    experienceLevel: 'Tech Lead', hoursAgo: 600,
    summary: 'Liderazgo tecnico de squad que desarrolla software agroindustrial usado en todo el pais.',
    body: [
      ['El desafio', 'Guiar decisiones tecnicas, revisar codigo y acompaniar el crecimiento de 4-6 desarrolladores manteniendo entregas continuas.'],
      ['- 5+ anios con .NET\n- Experiencia liderando equipos\n- Azure DevOps / CI CD\n- SQL Server avanzado'],
    ],
  },
]

export function buildMockJobs(): Job[] {
  return SEEDS.map((s) => {
    const haystack = [s.title, s.company || '', s.summary, s.skills.join(' '), s.body.flat().join(' ')].join(' ').toLowerCase()
    const matched = PROFILE_SKILLS.filter((k) => haystack.includes(k.toLowerCase()))
    const gaps = PROFILE_SKILLS.filter((k) => !haystack.includes(k.toLowerCase()))
    const total = matched.length + gaps.length
    const state = getMockState(s.id)
    return {
      id: s.id,
      source: s.source,
      externalId: `MOCK-${s.id}`,
      title: s.title,
      company: s.confidential ? null : s.company,
      description: formatDescription(s),
      location:
        s.city === s.department
          ? `${s.city}, ${s.country}`
          : `${s.city} (${s.department}), ${s.country}`,
      city: s.city,
      department: s.department,
      country: s.country,
      url: `https://mock.${s.source}.example/listing/${s.id}`,
      applicationUrl: `https://mock.${s.source}.example/listing/${s.id}/apply`,
      publishedAt: ago(s.hoursAgo),
      scrapedAt: ago(Math.max(0, s.hoursAgo - 1)),
      modality: s.remoteLabel,
      employmentType: s.employmentType,
      salary: s.salary,
      skills: s.skills,
      experienceLevel: s.experienceLevel,
      isConfidential: Boolean(s.confidential),
      status: state.status,
      saved: state.saved,
      notes: state.notes,
      reviewedAt: state.reviewedAt,
      createdAt: ago(s.hoursAgo),
      updatedAt: ago(s.hoursAgo),
      matchScore: total ? Math.round((100 * matched.length) / total) : null,
      matchStrong: matched,
      matchGaps: gaps.slice(0, 6),
    }
  })
}

function formatDescription(s: MockSeed): string {
  const lines: string[] = []
  lines.push(s.summary)
  lines.push('')
  lines.push(s.body[0][0])
  lines.push('')
  lines.push(s.body[0][1])
  if (s.body[1].length && s.body[1][0]) {
    lines.push('')
    lines.push('Requisitos')
    lines.push('')
    lines.push(s.body[1][0])
  }
  return lines.join('\n')
}

interface MockJobState {
  status: JobStatus
  saved: boolean
  notes: string | null
  reviewedAt: string | null
}

const STATE_KEY = 'jm_mock_user_state'

function loadAllStates(): Record<string, MockJobState> {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY) || '{}')
  } catch {
    return {}
  }
}

function getMockState(id: number): MockJobState {
  return (
    loadAllStates()[String(id)] || { status: 'new' as JobStatus, saved: false, notes: null, reviewedAt: null }
  )
}

export function persistMockState(id: number, patch: Partial<MockJobState>) {
  const all = loadAllStates()
  all[String(id)] = { ...getMockState(id), ...patch }
  localStorage.setItem(STATE_KEY, JSON.stringify(all))
}
