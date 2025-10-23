export const Config = {
  // URLs dos ambientes
  environments: {
    production: 'https://iris-produtividade-app.vercel.app/'
  },
  
  getBaseURL() {
    return 'https://iris-produtividade-app.vercel.app/';
  },
  
  // Endpoints da API
  endpoints: {
    auth: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      logout: '/api/auth/logout',
      me: '/api/auth/me'
    },
    tasks: {
      list: '/api/tasks',
      create: '/api/tasks',
      getById: (id) => `/api/tasks/${id}`,
      update: (id) => `/api/tasks/${id}`,
      delete: (id) => `/api/tasks/${id}`,
      complete: (id) => `/api/tasks/${id}/complete`,
      toggle: (id) => `/api/tasks/${id}/toggle`,
      inbox: '/api/tasks/inbox',
      today: '/api/tasks/today',
      upcoming: '/api/tasks/upcoming',
      calendar: '/api/tasks/calendar',
      search: '/api/tasks/search',
      addLabel: (id) => `/api/tasks/${id}/labels`,
      assignProject: (id) => `/api/tasks/${id}/project`
    },
    projects: {
      list: '/api/projects',
      create: '/api/projects',
      getById: (id) => `/api/projects/${id}`,
      update: (id) => `/api/projects/${id}`,
      delete: (id) => `/api/projects/${id}`,
      favorite: (id) => `/api/projects/${id}/favorite`,
      tasks: (id) => `/api/projects/${id}/tasks`
    }
  },
  
  // Timeouts
  timeouts: {
    default: 10000,
    long: 30000
  },
  
  /* 
  * Dados de teste padrão 
  */
  testData: {
    defaultName: 'Automação',
    defaultEmail: 'automacao@playwright.com',
    defaultPassword: 'Teste@123',
    domain: '@playwright.com'
  }
};
