import { test, expect } from '@playwright/test';
import { ApiHelper } from '../utils/api-helper.js';
import { Config } from '../config/test-config.js';

test.describe('API - Logout e Verificação de Usuário', () => {
  let apiHelper;
  let registeredUser;

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
    
    registeredUser = {
      name: 'Automação',
      email: 'automacao@playwright.com',
      password: 'Teste@123'
    };
  });

  test.describe('Logout', () => {
    test('Deve fazer logout com sucesso quando autenticado', async () => {
      // Faz login primeiro
      const loginResponse = await apiHelper.login(registeredUser.email, registeredUser.password);
      expect(loginResponse.status()).toBe(200);
      
      // Fazer logout
      const logoutResponse = await apiHelper.logout();
      
      expect(logoutResponse.status()).toBe(200);
      
      const responseBody = await logoutResponse.json();
      expect(responseBody.message).toBe('Logged out successfully');
    });

    test('Deve invalidar a sessão após logout', async () => {
      // Fazer login
      const loginResponse = await apiHelper.login(registeredUser.email, registeredUser.password);
      expect(loginResponse.status()).toBe(200);
      
      // Verificar se consegue acessar dados do usuário
      const userResponse1 = await apiHelper.getCurrentUser();
      expect(userResponse1.status()).toBe(200);
      
      // Fazer logout
      const logoutResponse = await apiHelper.logout();
      expect(logoutResponse.status()).toBe(200);
      
      // Tentar acessar dados do usuário após logout
      const userResponse2 = await apiHelper.getCurrentUser();
      expect(userResponse2.status()).toBe(401);
    });
  });

  test.describe('Verificação de Usuário Atual (/api/auth/me)', () => {
    test('Deve retornar dados do usuário quando autenticado', async () => {
      // Fazer login
      const loginResponse = await apiHelper.login(registeredUser.email, registeredUser.password);
      expect(loginResponse.status()).toBe(200);
      
      // Obter dados do usuário atual
      const userResponse = await apiHelper.getCurrentUser();
      
      expect(userResponse.status()).toBe(200);
      const responseBody = await userResponse.json();
      expect(responseBody.user).toBeDefined();
      
      // Validar estrutura do usuário
      apiHelper.validateUserStructure(responseBody.user);
      expect(responseBody.user.email).toBe(registeredUser.email);
      expect(responseBody.user.name).toBe(registeredUser.name);
      expect(responseBody.user.password).toBeUndefined();
    });

    test('Deve falhar quando não autenticado', async () => {
      // Tentar obter dados sem login
      const userResponse = await apiHelper.getCurrentUser();
      
      expect(userResponse.status()).toBe(401);
      const responseBody = await userResponse.json();
      apiHelper.validateErrorStructure(responseBody);
      expect(responseBody.authenticated).toBe(false);
    });

    test('Deve falhar com sessão inválida', async () => {
      // Fazer uma requisição com cookie de sessão inválido
      const userResponse = await apiHelper.request.get(`${Config.getBaseURL()}${Config.endpoints.auth.me}`, {
        headers: {
          ...apiHelper.getDefaultHeaders(),
          'Cookie': 'session=invalid_session_token'
        }
      });
      
      expect(userResponse.status()).toBe(401);
      const responseBody = await userResponse.json();
      apiHelper.validateErrorStructure(responseBody);
    });
  });

  test.describe('Fluxo Completo de Autenticação', () => {
    test('Deve executar fluxo completo: registro -> login -> verificação -> logout', async () => {
      const newUser = apiHelper.generateUserData();
      
      // 1. Registrar novo usuário
      const registerResponse = await apiHelper.register(newUser.name, newUser.email, newUser.password);
      expect(registerResponse.status()).toBe(201);
      
      // 2. Fazer login
      const loginResponse = await apiHelper.login(newUser.email, newUser.password);
      expect(loginResponse.status()).toBe(200);
      
      // 3. Verificar dados do usuário
      const userResponse = await apiHelper.getCurrentUser();
      expect(userResponse.status()).toBe(200);
      const userData = await userResponse.json();
      expect(userData.user.email).toBe(newUser.email);
      
      // 4. Fazer logout
      const logoutResponse = await apiHelper.logout();
      expect(logoutResponse.status()).toBe(200);
      
      // 5. Verificar que não consegue mais acessar dados
      const userResponseAfterLogout = await apiHelper.getCurrentUser();
      expect(userResponseAfterLogout.status()).toBe(401);
    });

    test('Deve manter sessão entre múltiplas requisições', async () => {
      // Fazer login
      const loginResponse = await apiHelper.login(registeredUser.email, registeredUser.password);
      expect(loginResponse.status()).toBe(200);
      
      // Fazer múltiplas requisições para verificar dados do usuário
      for (let i = 0; i < 3; i++) {
        const userResponse = await apiHelper.getCurrentUser();
        expect(userResponse.status()).toBe(200);
        
        const userData = await userResponse.json();
        expect(userData.user.email).toBe(registeredUser.email);
      }
    });

    test('Deve permitir novo login após logout', async () => {
      // Login -> Logout -> Login novamente
      const loginResponse1 = await apiHelper.login(registeredUser.email, registeredUser.password);
      expect(loginResponse1.status()).toBe(200);
      
      const logoutResponse = await apiHelper.logout();
      expect(logoutResponse.status()).toBe(200);
      
      const loginResponse2 = await apiHelper.login(registeredUser.email, registeredUser.password);
      expect(loginResponse2.status()).toBe(200);
      
      // Verificar que consegue acessar dados após novo login
      const userResponse = await apiHelper.getCurrentUser();
      expect(userResponse.status()).toBe(200);
    });
  });
});
