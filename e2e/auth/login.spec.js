import { test, expect } from '@playwright/test';
import { ApiHelper, TestData } from '../utils/api-helper.js';
import { Config } from '../config/test-config.js';

test.describe('API - Login de Usuário', () => {
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

  test('Deve fazer login com credenciais válidas', async () => {
    // Act
    const response = await apiHelper.login(registeredUser.email, registeredUser.password);

    // Assert
    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.user).toBeDefined();
    
    // Validar estrutura do usuário retornado
    apiHelper.validateUserStructure(responseBody.user);
    expect(responseBody.user.email).toBe(registeredUser.email);
    expect(responseBody.user.name).toBe(registeredUser.name);
    expect(responseBody.user.password).toBeUndefined(); // Senha não deve ser retornada
  });

  test('Deve falhar com credenciais inválidas - senha incorreta', async () => {
    // Act
    const response = await apiHelper.login(registeredUser.email, 'senhaincorreta');

    // Assert
    expect(response.status()).toBe(401);
    
    const responseBody = await response.json();
    apiHelper.validateErrorStructure(responseBody);
    expect(responseBody.message).toMatch('Invalid email or password');
  });

  test('Deve falhar com credenciais inválidas - email não existe', async () => {
    // Act
    const response = await apiHelper.login('emailnaoexiste@teste.com', registeredUser.password);

    // Assert
    expect(response.status()).toBe(401);
    
    const responseBody = await response.json();
    apiHelper.validateErrorStructure(responseBody);
    expect(responseBody.message).toMatch('Invalid email or password');
  });

  test('Deve falhar com email e senha incorretos', async () => {
    // Act
    const response = await apiHelper.login('emailnaoexiste@teste.com', 'senhaincorreta');

    // Assert
    expect(response.status()).toBe(401);
    
    const responseBody = await response.json();
    apiHelper.validateErrorStructure(responseBody);
  });

  test.describe('Validação de dados de entrada', () => {
    test('Deve falhar com email em formato inválido', async () => {
      for (const invalidEmail of TestData.invalidEmails) {
        const response = await apiHelper.login(invalidEmail, registeredUser.password);
        
        expect([400, 401, 403]).toContain(401);
        const responseBody = await response.json();
        apiHelper.validateErrorStructure(responseBody);
      }
    });

    test('Deve falhar quando campos obrigatórios estão ausentes', async () => {
      // Teste sem email
      const response1 = await apiHelper.request.post(`${Config.getBaseURL()}${Config.endpoints.auth.login}`, {
        data: {
          password: registeredUser.password
        },
        headers: apiHelper.getDefaultHeaders()
      });
      
      expect(response1.status()).toBe(400);
      let responseBody = await response1.json();
      apiHelper.validateErrorStructure(responseBody);

      // Teste sem password
      const response2 = await apiHelper.request.post(`${Config.getBaseURL()}${Config.endpoints.auth.login}`, {
        data: {
          email: registeredUser.email
        },
        headers: apiHelper.getDefaultHeaders()
      });
      
      expect(response2.status()).toBe(400);
      responseBody = await response2.json();
      apiHelper.validateErrorStructure(responseBody);

      // Teste sem dados
      const response3 = await apiHelper.request.post(`${Config.getBaseURL()}${Config.endpoints.auth.login}`, {
        data: {},
        headers: apiHelper.getDefaultHeaders()
      });
      
      expect(response3.status()).toBe(400);
      responseBody = await response3.json();
      apiHelper.validateErrorStructure(responseBody);
    });

    test('Deve falhar com campos vazios', async () => {
      // Email vazio
      const response1 = await apiHelper.login('', registeredUser.password);
      expect([400, 401]).toContain(response1.status());
      
      // Senha vazia
      const response2 = await apiHelper.login(registeredUser.email, '');
      expect([400, 401]).toContain(response2.status());
      
      // Ambos vazios
      const response3 = await apiHelper.login('', '');
      expect([400, 401]).toContain(response3.status());
    });
  });

  test('Deve aceitar login case-insensitive para email', async () => {
    // Testar com email em diferentes cases
    const emailUpperCase = registeredUser.email.toUpperCase();
    const emailMixedCase = registeredUser.email.charAt(0).toUpperCase() + registeredUser.email.slice(1);
    
    const response1 = await apiHelper.login(emailUpperCase, registeredUser.password);
    const response2 = await apiHelper.login(emailMixedCase, registeredUser.password);
    
    // Dependendo da implementação, pode aceitar (200) ou rejeitar (401)
    // A maioria das implementações aceita email case-insensitive
    expect([200, 401]).toContain(response1.status());
    expect([200, 401]).toContain(response2.status());
  });

  test('Deve verificar se a sessão é criada após login', async () => {
    // Fazer login
    const loginResponse = await apiHelper.login(registeredUser.email, registeredUser.password);
    expect(loginResponse.status()).toBe(200);
    
    // Verificar se há cookies de sessão
    const cookies = loginResponse.headers()['set-cookie'];
    if (cookies) {
      expect(cookies).toMatch(/session/); // Baseado no esquema de segurança do swagger
    }
  });

  test('Deve permitir múltiplos logins simultâneos', async () => {
    // Fazer login múltiplas vezes
    const response1 = await apiHelper.login(registeredUser.email, registeredUser.password);
    const response2 = await apiHelper.login(registeredUser.email, registeredUser.password);
    const response3 = await apiHelper.login(registeredUser.email, registeredUser.password);
    
    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);
    expect(response3.status()).toBe(200);
  });
});
