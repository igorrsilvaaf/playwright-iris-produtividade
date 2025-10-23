import { test, expect } from '@playwright/test';
import { ApiHelper, TestData } from '../utils/api-helper.js';
import { Config } from '../config/test-config.js';

test.describe('API - Registro de Usuário', () => {
  let apiHelper;

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test('Deve registrar um novo usuário com dados válidos', async () => {
    // Arrange
    const userData = apiHelper.generateUserData();
    const response = await apiHelper.register(userData.name, userData.email, userData.password, userData.confirmPassword);

    // Assert
    expect(response.status()).toBe(201);
    
    const responseBody = await response.json();
    console.log('Resposta da API:', JSON.stringify(responseBody, null, 2));
    
    // Verificar se existe success ou usar outra validação
    if (responseBody.success !== undefined) {
      expect(responseBody.success).toBe(true);
    } else {
      // Se não há campo success, verificar se há user ou message
      expect(responseBody.user || responseBody.message).toBeDefined();
    }
    expect(responseBody.user).toBeDefined();
    
  });

  test('Deve falhar ao tentar registrar usuário com email já existente', async () => {
    // Arrange
    const userData = apiHelper.generateUserData();
    
    // Primeiro registro
    await apiHelper.register(userData.name, userData.email, userData.password, userData.confirmPassword);

    // Act - Tentar registrar novamente com mesmo email
    const response = await apiHelper.register('Outro Nome', userData.email, 'Outra@senha123');

    // Assert
    expect(response.status()).toBe(409);
    
    const responseBody = await response.json();
    apiHelper.validateErrorStructure(responseBody);
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error).toContain('Email já está em uso');
  });

  test.describe('Validação de dados de entrada', () => {
    test('Deve falhar com email inválido', async () => {
      for (const invalidEmail of TestData.invalidEmails) {
        const response = await apiHelper.register('Nome Teste', invalidEmail, 'senha123');
        
        expect(response.status()).toBe(400);
        const responseBody = await response.json();
        apiHelper.validateErrorStructure(responseBody);
      }
    });

    test('Deve falhar com senha muito curta', async () => {
      for (const invalidPassword of TestData.invalidPasswords) {
        const userData = apiHelper.generateUserData();
        const response = await apiHelper.register(userData.name, userData.email, invalidPassword);
        
        expect(response.status()).toBe(400);
        const responseBody = await response.json();
        apiHelper.validateErrorStructure(responseBody);
      }
    });

    test('Deve falhar com nome vazio', async () => {
      for (const invalidName of TestData.invalidNames) {
        const userData = apiHelper.generateUserData();
        const response = await apiHelper.register(invalidName, userData.email, userData.password);
        
        expect(response.status()).toBe(400);
        const responseBody = await response.json();
        apiHelper.validateErrorStructure(responseBody);
        expect(responseBody.error).toMatch(/Campos obrigatórios ausentes|Nome é obrigatório/)
      }
    });

    test('Deve falhar quando campos obrigatórios estão ausentes', async () => {
      // Teste sem nome
      const response1 = await apiHelper.request.post(`${Config.getBaseURL()}${Config.endpoints.auth.register}`, {
        data: {
          email: 'teste@exemplo.com',
          password: 'senha123'
        },
        headers: apiHelper.getDefaultHeaders()
      });
      
      expect(response1.status()).toBe(400);
      let responseBody = await response1.json();
      apiHelper.validateErrorStructure(responseBody);

      // Teste sem email
      const response2 = await apiHelper.request.post(`${Config.getBaseURL()}${Config.endpoints.auth.register}`, {
        data: {
          name: 'Nome Teste',
          password: 'senha123'
        },
        headers: apiHelper.getDefaultHeaders()
      });
      
      expect(response2.status()).toBe(400);
      responseBody = await response2.json();
      apiHelper.validateErrorStructure(responseBody);

      // Teste sem password
      const response3 = await apiHelper.request.post(`${Config.getBaseURL()}${Config.endpoints.auth.register}`, {
        data: {
          name: 'Nome Teste',
          email: 'teste@exemplo.com'
        },
        headers: apiHelper.getDefaultHeaders()
      });
      
      expect(response3.status()).toBe(400);
      responseBody = await response3.json();
      apiHelper.validateErrorStructure(responseBody);
    });
  });

  test('Deve falhar com Content-Type incorreto', async () => {
    const userData = apiHelper.generateUserData();
    
    const response = await apiHelper.request.post(`${Config.getBaseURL()}${Config.endpoints.auth.register}`, {
      data: `name=${userData.name}&email=${userData.email}&password=${userData.password}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Dependendo da implementação da API, pode retornar 400 ou 415
    expect([400, 415]).toContain(response.status());
  });
});
