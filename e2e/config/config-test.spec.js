import { test, expect } from '@playwright/test';
import { ApiHelper } from '../utils/api-helper.js';
import { Config } from '../config/test-config.js';

test.describe('Verificação de Configuração', () => {
  test('Deve estar configurado para usar a URL de produção', async ({ request }) => {
    const apiHelper = new ApiHelper(request);
    
    console.log('🔧 URL Base configurada:', Config.getBaseURL());
    console.log('🌐 Testando contra:', apiHelper.baseURL);
    
    expect(apiHelper.baseURL).toBe('https://iris-produtividade-app.vercel.app/');
  });

  test('Deve conseguir fazer uma requisição para a API de produção', async ({ request }) => {
    const apiHelper = new ApiHelper(request);
    
    // Tentativa de fazer uma requisição simples (que deve falhar por não ter auth, mas não por conexão)
    const response = await request.get(`${apiHelper.baseURL}/api/auth/me`);
    
    // Esperamos 401 (não autorizado) em vez de erro de conexão
    expect([401, 404, 200]).toContain(response.status());
    console.log('✅ API respondeu com status:', response.status());
  });
});