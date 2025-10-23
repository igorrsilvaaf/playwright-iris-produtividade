import { test, expect } from '@playwright/test';
import { ApiHelper, TestData } from '../utils/api-helper.js';
import { Config } from '../config/test-config.js';

test.describe('API - Tasks', () => {
  let apiHelper;

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
    await apiHelper.getAuthenticatedContext();
  });

  test.describe('✅ Criação de Tarefas', () => {
    
    test('Deve criar uma nova tarefa com dados completos', async () => {
      const taskData = {
        title: `Tarefa Teste ${Date.now()}`,
        description: 'Descrição da tarefa de teste',
        priority: 2
      };

      const response = await apiHelper.createTask(taskData);

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.task).toBeDefined();
      
      apiHelper.validateTaskStructure(responseBody.task);
      expect(responseBody.task.title).toBe(taskData.title);
      expect(responseBody.task.description).toBe(taskData.description);
      expect(responseBody.task.priority).toBe(taskData.priority);
      expect(responseBody.task.completed).toBe(false);
    });

    test('Deve criar tarefa apenas com título', async () => {
      const taskData = {
        title: `Tarefa Mínima ${Date.now()}`
      };

      const response = await apiHelper.createTask(taskData);

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.task.title).toBe(taskData.title);
      expect(responseBody.task.completed).toBe(false);
      expect(responseBody.task.priority).toBe(4);
    });

    test('Deve aceitar diferentes valores de prioridade (1-4)', async () => {
      const priorities = [1, 2, 3, 4];

      for (const priority of priorities) {
        const taskData = {
          title: `Tarefa Prioridade ${priority} - ${Date.now()}`,
          priority: priority
        };

        const response = await apiHelper.createTask(taskData);
        expect(response.status()).toBe(200);
        
        const responseBody = await response.json();
        expect(responseBody.task.priority).toBe(priority);
      }
    });

    test('Deve criar múltiplas tarefas rapidamente', async () => {
      const startTime = Date.now();
      const taskCount = 3;
      const createdTasks = [];

      for (let i = 0; i < taskCount; i++) {
        const response = await apiHelper.createTask({
          title: `Tarefa Batch ${i + 1} - ${Date.now()}`,
          description: `Teste batch #${i + 1}`,
          priority: 2
        });
        
        expect(response.status()).toBe(200);
        
        const data = await response.json();
        createdTasks.push(data.task);
      }

      const totalTime = Date.now() - startTime;
      
      expect(totalTime).toBeLessThan(10000);
      expect(createdTasks.length).toBe(taskCount);
    });
  });

  test.describe('📋 Listagem de Tarefas', () => {
    
    test('Deve listar todas as tarefas do usuário', async () => {
      const taskData = {
        title: `Tarefa Lista ${Date.now()}`
      };
      await apiHelper.createTask(taskData);

      const response = await apiHelper.getTasks();

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.tasks).toBeDefined();
      expect(Array.isArray(responseBody.tasks)).toBe(true);
      expect(responseBody.tasks.length).toBeGreaterThan(0);

      responseBody.tasks.forEach(task => {
        expect(task.id).toBeDefined();
        expect(task.title).toBeDefined();
        expect(typeof task.completed).toBe('boolean');
      });
    });

    test('Deve listar tarefas da inbox', async () => {
      const response = await apiHelper.getInboxTasks();

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.tasks).toBeDefined();
      expect(Array.isArray(responseBody.tasks)).toBe(true);

      responseBody.tasks.forEach(task => {
        expect(task.id).toBeDefined();
        expect(task.title).toBeDefined();
        expect(typeof task.completed).toBe('boolean');
      });
    });

    test('Deve listar tarefas de hoje', async () => {
      const response = await apiHelper.getTodayTasks();

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.tasks).toBeDefined();
      expect(Array.isArray(responseBody.tasks)).toBe(true);
    });

    test('Deve listar tarefas futuras', async () => {
      const response = await apiHelper.getUpcomingTasks();

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.tasks).toBeDefined();
      expect(Array.isArray(responseBody.tasks)).toBe(true);
    });

    test('Deve manter consistência entre criação e listagem', async () => {
      const taskData = {
        title: `Tarefa Consistência ${Date.now()}`,
        description: 'Teste de consistência de dados',
        priority: 3
      };

      const createResponse = await apiHelper.createTask(taskData);
      expect(createResponse.status()).toBe(200);
      
      const createdTask = await createResponse.json();
      const taskId = createdTask.task.id;

      const listResponse = await apiHelper.getTasks();
      expect(listResponse.status()).toBe(200);
      
      const listData = await listResponse.json();
      const foundTask = listData.tasks.find(task => task.id === taskId);

      expect(foundTask).toBeDefined();
      expect(foundTask.title).toBe(taskData.title);
      expect(foundTask.description).toBe(taskData.description);
      expect(foundTask.priority).toBe(taskData.priority);
    });
  });

  test.describe('❌ Validações de Erro', () => {
    
    test('Deve falhar ao criar tarefa sem título', async () => {
      const response = await apiHelper.createTask({
        description: 'Descrição sem título'
      });

      expect([400, 422, 500]).toContain(response.status());
      
      const responseBody = await response.json();
      expect(responseBody.error || responseBody.message).toBeDefined();
    });

    test('Deve falhar ao criar tarefa com título vazio', async () => {
      const response = await apiHelper.createTask({ title: '' });

      expect([400, 422, 500]).toContain(response.status());
    });

    test('Deve falhar com prioridade inválida', async () => {
      const response = await apiHelper.createTask({
        title: 'Teste prioridade inválida',
        priority: 'invalid'
      });

      expect([400, 422, 500]).toContain(response.status());
    });

    test('Deve aceitar ou rejeitar prioridade fora do range', async () => {
      const response = await apiHelper.createTask({
        title: 'Teste prioridade fora do range',
        priority: 5
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.task).toBeDefined();
      } else {
        expect([400, 422, 500]).toContain(response.status());
      }
    });

    test('Deve falhar busca sem parâmetro query', async () => {
      const response = await apiHelper.request.get(`${Config.getBaseURL()}/api/tasks/search`, {
        headers: apiHelper.getDefaultHeaders()
      });

      expect(response.status()).toBe(400);
    });

    test('Deve validar Content-Type', async () => {
      const response = await apiHelper.request.post(`${Config.getBaseURL()}/api/tasks`, {
        data: JSON.stringify({ title: 'Teste Content-Type' }),
        headers: {
          'Content-Type': 'text/plain',
          ...apiHelper.sessionCookies
        }
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.task || data.success).toBeDefined();
      } else {
        expect([400, 415, 500]).toContain(response.status());
      }
    });
  });

  test.describe('🔍 Casos Extremos', () => {
    
    test('Deve validar caracteres especiais no título', async () => {
      const specialTitles = [
        'Tarefa com émojis 🚀✨',
        'Tarefa com "aspas" e \'apostrofes\'',
        'Tarefa com <html> & símbolos'
      ];

      for (const title of specialTitles) {
        const response = await apiHelper.createTask({ title });
        
        if (response.status() === 200) {
          const data = await response.json();
          expect(data.task.title).toBeDefined();
        } else {
          expect([400, 422, 500]).toContain(response.status());
        }
      }
    });

    test('Deve lidar com título muito longo', async () => {
      const response = await apiHelper.createTask({
        title: 'A'.repeat(1000)
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.task.title).toBeDefined();
      } else {
        expect([400, 422, 500]).toContain(response.status());
      }
    });

    test('Deve criar tarefas simultaneamente sem conflito', async () => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        promises.push(
          apiHelper.createTask({
            title: `Tarefa Simultânea ${i + 1} - ${Date.now()}`,
            priority: (i % 4) + 1
          })
        );
      }

      const responses = await Promise.all(promises);

      responses.forEach((response, index) => {
        expect(response.status()).toBe(200);
      });
    });
  });

  test.describe('🔐 Autenticação', () => {
    
    test('Deve manter sessão durante múltiplas requisições', async () => {
      const responses = await Promise.all([
        apiHelper.getTasks(),
        apiHelper.getInboxTasks(),
        apiHelper.getTodayTasks(),
        apiHelper.getUpcomingTasks()
      ]);

      responses.forEach((response) => {
        expect(response.status()).toBe(200);
      });
    });

    test('Deve aceitar Content-Type correto', async () => {
      const response = await apiHelper.request.post(`${Config.getBaseURL()}/api/tasks`, {
        data: { title: `Teste Content-Type Correto ${Date.now()}` },
        headers: apiHelper.getDefaultHeaders()
      });

      expect(response.status()).toBe(200);
    });
  });
});