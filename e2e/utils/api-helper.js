import { Config } from '../config/test-config.js';

/*
 * Helper class para interação com APIs de autenticação e tasks
 * Gerencia sessões e fornece métodos para operações CRUD
 */
export class ApiHelper {
  constructor(request) {
    this.request = request;
    this.baseURL = Config.getBaseURL();
    this.isAuthenticated = false;
    this.sessionCookies = null;
  }

  /*
   * Retorna headers padrão para requisições HTTP
   * Inclui cookie de sessão quando autenticado
   */
  getDefaultHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (this.sessionCookies) {
      headers['Cookie'] = this.sessionCookies;
    }
    
    return headers;
  }

  /*
   * Realiza login na API e armazena cookie de sessão
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<Response>} Resposta da API
   */
  async login(email, password) {
    const response = await this.request.post(`${this.baseURL}${Config.endpoints.auth.login}`, {
      data: {
        email,
        password
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (response.status() === 200) {
      const setCookieHeader = response.headers()['set-cookie'];
      if (setCookieHeader) {
        const sessionMatch = setCookieHeader.match(/session=([^;]+)/);
        if (sessionMatch) {
          this.sessionCookies = `session=${sessionMatch[1]}`;
          this.isAuthenticated = true;
        }
      }
    }
    
    return response;
  }

  /*
   * Registra novo usuário na API
   * @param {string} name - Nome do usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<Response>} Resposta da API
   */
  async register(name, email, password) {
    const response = await this.request.post(`${this.baseURL}${Config.endpoints.auth.register}`, {
      data: {
        name,
        email,
        password
      },
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Realiza logout e limpa cookie de sessão
   * @returns {Promise<Response>} Resposta da API
   */
  async logout() {
    const response = await this.request.post(`${this.baseURL}${Config.endpoints.auth.logout}`, {
      headers: this.getDefaultHeaders()
    });
    
    if (response.status() === 200) {
      this.sessionCookies = null;
      this.isAuthenticated = false;
    }
    
    return response;
  }

  /*
   * Obtém dados do usuário atual autenticado
   * @returns {Promise<Response>} Resposta da API com dados do usuário
   */
  async getCurrentUser() {
    const response = await this.request.get(`${this.baseURL}${Config.endpoints.auth.me}`, {
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Gera dados de usuário para testes com timestamp único
   * @returns {Object} Objeto com dados de usuário para teste
   */
  generateUserData() {
    const timestamp = Date.now();
    return {
      name: `Usuario Teste ${timestamp}`,
      email: `teste${timestamp}${Config.testData.domain}`,
      password: Config.testData.defaultPassword,
      confirmPassword: Config.testData.defaultPassword
    };
  }

  /*
   * Valida estrutura obrigatória do objeto usuário
   * @param {Object} user - Objeto usuário para validar
   * @returns {boolean} True se válido
   * @throws {Error} Se estrutura inválida
   */
  validateUserStructure(user) {
    const requiredFields = ['id', 'name', 'email'];
    
    for (const field of requiredFields) {
      if (!(field in user)) {
        throw new Error(`Campo obrigatório '${field}' não encontrado no objeto user`);
      }
    }

    if (typeof user.id !== 'number') {
      throw new Error('Campo id deve ser um número');
    }
    
    if (typeof user.name !== 'string') {
      throw new Error('Campo name deve ser uma string');
    }
    
    if (typeof user.email !== 'string') {
      throw new Error('Campo email deve ser uma string');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      throw new Error('Campo email deve ter formato válido');
    }

    return true;
  }

  /*
   * Valida estrutura de resposta de erro da API
   * @param {Object} error - Objeto de erro para validar
   * @returns {boolean} True se estrutura válida
   * @throws {Error} Se estrutura inválida
   */
  validateErrorStructure(error) {
    if (error.hasOwnProperty('message') && typeof error.message === 'string') {
      return true;
    }

    if (error.hasOwnProperty('authenticated') && Object.keys(error).length === 1) {
      if (typeof error.authenticated !== 'boolean') {
        throw new Error('Campo authenticated deve ser um boolean');
      }
      return true;
    }

    return false;
  }

  /*
   * Lista todas as tarefas do usuário autenticado
   * @returns {Promise<Response>} Resposta da API com lista de tarefas
   */
  async getTasks() {
    const response = await this.request.get(`${this.baseURL}${Config.endpoints.tasks.list}`, {
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Cria nova tarefa na API
   * @param {Object} taskData - Dados da tarefa (title obrigatório, description e priority opcionais)
   * @returns {Promise<Response>} Resposta da API com tarefa criada
   */
  async createTask(taskData) {
    const response = await this.request.post(`${this.baseURL}${Config.endpoints.tasks.create}`, {
      data: taskData,
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Obtém tarefa específica por ID
   * @param {number} id - ID da tarefa
   * @returns {Promise<Response>} Resposta da API com dados da tarefa
   */
  async getTaskById(id) {
    const response = await this.request.get(`${this.baseURL}${Config.endpoints.tasks.getById(id)}`, {
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Atualiza tarefa existente
   * @param {number} id - ID da tarefa
   * @param {Object} taskData - Dados para atualizar
   * @returns {Promise<Response>} Resposta da API com tarefa atualizada
   */
  async updateTask(id, taskData) {
    const response = await this.request.put(`${this.baseURL}${Config.endpoints.tasks.update(id)}`, {
      data: taskData,
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Remove tarefa por ID
   * @param {number} id - ID da tarefa
   * @returns {Promise<Response>} Resposta da API
   */
  async deleteTask(id) {
    const response = await this.request.delete(`${this.baseURL}${Config.endpoints.tasks.delete(id)}`, {
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Marca tarefa como completa ou incompleta
   * @param {number} id - ID da tarefa
   * @param {boolean} completed - Status de conclusão
   * @returns {Promise<Response>} Resposta da API
   */
  async completeTask(id, completed = true) {
    const response = await this.request.post(`${this.baseURL}${Config.endpoints.tasks.complete(id)}`, {
      data: { completed },
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Alterna status de conclusão da tarefa
   * @param {number} id - ID da tarefa
   * @returns {Promise<Response>} Resposta da API
   */
  async toggleTask(id) {
    const response = await this.request.post(`${this.baseURL}${Config.endpoints.tasks.toggle(id)}`, {
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Lista tarefas da inbox (sem projeto ou data)
   * @returns {Promise<Response>} Resposta da API com tarefas da inbox
   */
  async getInboxTasks() {
    const response = await this.request.get(`${this.baseURL}${Config.endpoints.tasks.inbox}`, {
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Lista tarefas com vencimento para hoje
   * @returns {Promise<Response>} Resposta da API com tarefas de hoje
   */
  async getTodayTasks() {
    const response = await this.request.get(`${this.baseURL}${Config.endpoints.tasks.today}`, {
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Lista tarefas com vencimento futuro
   * @returns {Promise<Response>} Resposta da API com tarefas futuras
   */
  async getUpcomingTasks() {
    const response = await this.request.get(`${this.baseURL}${Config.endpoints.tasks.upcoming}`, {
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Busca tarefas por termo de pesquisa
   * @param {string} query - Termo de busca
   * @returns {Promise<Response>} Resposta da API com resultados da busca
   */
  async searchTasks(query) {
    const response = await this.request.get(`${this.baseURL}${Config.endpoints.tasks.search}?query=${encodeURIComponent(query)}`, {
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Gera dados de tarefa para testes com timestamp único
   * @returns {Object} Objeto com dados de tarefa para teste
   */
  generateTaskData() {
    const timestamp = Date.now();
    return {
      title: `Tarefa Teste ${timestamp}`,
      description: `Descrição da tarefa de teste criada em ${new Date().toISOString()}`,
      priority: 2 
    };
  }

  /*
   * Valida estrutura obrigatória do objeto tarefa
   * @param {Object} task - Objeto tarefa para validar
   * @returns {boolean} True se válido
   * @throws {Error} Se estrutura inválida
   */
  validateTaskStructure(task) {
    const requiredFields = ['id', 'title', 'completed', 'created_at', 'updated_at', 'user_id'];
    
    for (const field of requiredFields) {
      if (!(field in task)) {
        throw new Error(`Campo obrigatório '${field}' não encontrado no objeto task`);
      }
    }

    if (typeof task.id !== 'number') {
      throw new Error('Campo id deve ser um número');
    }
    
    if (typeof task.title !== 'string') {
      throw new Error('Campo title deve ser uma string');
    }
    
    if (typeof task.completed !== 'boolean') {
      throw new Error('Campo completed deve ser um boolean');
    }

    if (typeof task.user_id !== 'number') {
      throw new Error('Campo user_id deve ser um número');
    }

    if (task.priority !== undefined && task.priority !== null) {
      if (typeof task.priority !== 'number' || ![1, 2, 3, 4].includes(task.priority)) {
        throw new Error('Campo priority deve ser 1, 2, 3 ou 4');
      }
    }

    if (task.due_date && isNaN(Date.parse(task.due_date))) {
      throw new Error('Campo due_date deve ser uma data válida');
    }

    if (isNaN(Date.parse(task.created_at))) {
      throw new Error('Campo created_at deve ser uma data válida');
    }

    if (isNaN(Date.parse(task.updated_at))) {
      throw new Error('Campo updated_at deve ser uma data válida');
    }

    return true;
  }

  /*
   * Garante contexto autenticado para testes
   * Realiza login apenas se necessário, reutilizando sessões existentes
   * @returns {Promise<Response|void>} Resposta do login ou void se já autenticado
   * @throws {Error} Se login falhar
   */
  async getAuthenticatedContext() {
    if (this.isAuthenticated && this.sessionCookies) {
      return;
    }
    
    const loginResponse = await this.login(Config.testData.defaultEmail, Config.testData.defaultPassword);
    if (loginResponse.status() !== 200) {
      const errorBody = await loginResponse.json();
      console.error('Erro no login:', errorBody);
      throw new Error(`Falha ao fazer login para contexto autenticado. Status: ${loginResponse.status()}`);
    }
    
    console.log('Login realizado com sucesso. Sessão estabelecida.');
    return loginResponse;
  }

  /*
   * Lista projetos disponíveis para o usuário autenticado
   * @returns {Promise<Response>} Resposta da API com projetos
   */
  async getProjects() {
    const response = await this.request.get(`${this.baseURL}${Config.endpoints.projects.list}`, {
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Cria novo projeto no workspaces do usuário
   * @param {Object} projectData - Dados do projeto (nome obrigatório)
   * @returns {Promise<Response>} Resposta da API com projeto criado
   */
  async createProject(projectData) {
    const response = await this.request.post(`${this.baseURL}${Config.endpoints.projects.create}`, {
      data: projectData,
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Consulta projeto específico por ID
   * @param {number} id - ID do projeto
   * @returns {Promise<Response>} Resposta da API com dados do projeto
   */
  async getProjectById(id) {
    const response = await this.request.get(`${this.baseURL}${Config.endpoints.projects.getById(id)}`, {
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Atualiza dados de um projeto existente
   * @param {number} id - ID do projeto
   * @param {Object} projectData - Campos para atualização
   * @returns {Promise<Response>} Resposta da API com projeto atualizado
   */
  async updateProject(id, projectData) {
    const response = await this.request.put(`${this.baseURL}${Config.endpoints.projects.update(id)}`, {
      data: projectData,
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Remove projeto por ID
   * @param {number} id - ID do projeto
   * @returns {Promise<Response>} Resposta da API
   */
  async deleteProject(id) {
    const response = await this.request.delete(`${this.baseURL}${Config.endpoints.projects.delete(id)}`, {
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Define se projeto está favoritado
   * @param {number} id - ID do projeto
   * @param {boolean} isFavorite - Status desejado
   * @returns {Promise<Response>} Resposta da API
   */
  async toggleProjectFavorite(id, isFavorite) {
    const response = await this.request.post(`${this.baseURL}${Config.endpoints.projects.favorite(id)}`, {
      data: { isFavorite },
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Lista tarefas associadas a um projeto
   * @param {number} id - ID do projeto
   * @returns {Promise<Response>} Resposta da API com tarefas
   */
  async getProjectTasks(id) {
    const response = await this.request.get(`${this.baseURL}${Config.endpoints.projects.tasks(id)}`, {
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Adiciona label a uma tarefa específica
   * @param {number} taskId - ID da tarefa
   * @param {number} labelId - ID da label
   * @returns {Promise<Response>} Resposta da API
   */
  async addLabelToTask(taskId, labelId) {
    const response = await this.request.post(`${this.baseURL}${Config.endpoints.tasks.addLabel(taskId)}`, {
      data: { labelId },
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Associa uma tarefa a um projeto
   * @param {number} taskId - ID da tarefa
   * @param {number} projectId - ID do projeto
   * @returns {Promise<Response>} Resposta da API
   */
  async assignProjectToTask(taskId, projectId) {
    const response = await this.request.post(`${this.baseURL}${Config.endpoints.tasks.assignProject(taskId)}`, {
      data: { projectId },
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  /*
   * Gera dados de projeto para testes com timestamp único
   * @returns {Object} Objeto com dados de projeto
   */
  generateProjectData() {
    const timestamp = Date.now();
    return {
      name: `Projeto Teste ${timestamp}`,
      description: `Descrição do projeto de teste criado em ${new Date().toISOString()}`,
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      isFavorite: false
    };
  }
}

/*
 * Conjunto de dados reutilizáveis para cenários de teste
 * Inclui combinações válidas e inválidas para autenticação e tasks
 */
export const TestData = {
  validUser: {
    name: 'João Silva',
    email: 'joao.silva@teste.com',
    password: 'minhasenha123'
  },
  
  invalidEmails: [
    'email-invalido',
    'email@',
    '@dominio.com',
    'email.dominio.com',
    ''
  ],
  
  invalidPasswords: [
    '',
    '123',
    'Teste123456',
  ],
  
  invalidNames: [
    '',
    'Pl'
  ],

  validTask: {
    title: 'Tarefa de Teste',
    description: 'Descrição da tarefa de teste',
    priority: 2,
    completed: false
  },

  invalidTasks: {
    emptyTitle: {
      title: '',
      description: 'Descrição válida'
    },
    nullTitle: {
      title: null,
      description: 'Descrição válida'
    },
    invalidPriority: {
      title: 'Título válido',
      priority: 'invalid'
    },
    invalidPriorityNumber: {
      title: 'Título válido',
      priority: 999
    },
    invalidCompleted: {
      title: 'Título válido',
      completed: 'not_boolean'
    },
    invalidDueDate: {
      title: 'Título válido',
      dueDate: 'data-inválida'
    }
  },

  /*
   * Mapeamento de prioridades aceitas pela API de tarefas
   */
  priorities: {
    low: 1,
    medium: 2,
    high: 3,
    default: 4
  },
  
  longTitle: 'A'.repeat(1000), 

  taskUpdates: {
    title: 'Tarefa Atualizada',
    description: 'Descrição atualizada',
    priority: 3,
    completed: true
  }
};
