import { Config } from '../config/test-config.js';

export class ApiHelper {
  constructor(request) {
    this.request = request;
    this.baseURL = Config.getBaseURL();
  }

  // Headers padrão para requests
  getDefaultHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // Método para fazer login
  async login(email, password) {
    const response = await this.request.post(`${this.baseURL}${Config.endpoints.auth.login}`, {
      data: {
        email,
        password
      },
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  // Método para fazer registro
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

  // Método para fazer logout
  async logout() {
    const response = await this.request.post(`${this.baseURL}${Config.endpoints.auth.logout}`, {
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  // Método para obter informações do usuário atual
  async getCurrentUser() {
    const response = await this.request.get(`${this.baseURL}${Config.endpoints.auth.me}`, {
      headers: this.getDefaultHeaders()
    });
    return response;
  }

  // Gerador de dados de usuário para testes
  generateUserData() {
    const timestamp = Date.now();
    return {
      name: `Usuario Teste ${timestamp}`,
      email: `teste${timestamp}${Config.testData.domain}`,
      password: Config.testData.defaultPassword,
      confirmPassword: Config.testData.defaultPassword
    };
  }

  // Validar estrutura de resposta de usuário
  validateUserStructure(user) {
    const requiredFields = ['id', 'name', 'email'];
    
    for (const field of requiredFields) {
      if (!(field in user)) {
        throw new Error(`Campo obrigatório '${field}' não encontrado no objeto user`);
      }
    }

    // Validar tipos
    if (typeof user.id !== 'number') {
      throw new Error('Campo id deve ser um número');
    }
    
    if (typeof user.name !== 'string') {
      throw new Error('Campo name deve ser uma string');
    }
    
    if (typeof user.email !== 'string') {
      throw new Error('Campo email deve ser uma string');
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      throw new Error('Campo email deve ter formato válido');
    }

    return true;
  }

  // Validar estrutura de resposta de erro
  validateErrorStructure(error) {
    // Verificar se é uma resposta de erro de autenticação (apenas authenticated: false)
    if (error.hasOwnProperty('authenticated') && Object.keys(error).length === 1) {
      if (typeof error.authenticated !== 'boolean') {
        throw new Error('Campo authenticated deve ser um boolean');
      }
      return true;
    }
  }
}

// Dados de teste comuns
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
    '123', // muito curta
    'a', // muito curta
  ],
  
  invalidNames: [
    '',
    ' ', // apenas espaço
  ]
};
