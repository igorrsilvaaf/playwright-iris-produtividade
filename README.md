# Testes de API - To-Do List

```bash
npm install
```

3. Instale os navegadores do Playwright:

```bash
npx playwright install
```

## Executando os Testes

### Executar todos os testes

```bash
npm test
```

### Executar apenas testes de autenticação

```bash
npm run test:auth
```

### Executar testes com interface visual

```bash
npm run test:ui
```

### Executar testes em modo debug

```bash
npm run test:debug
```

### Executar testes com navegador visível

```bash
npm run test:headed
```

### Ver relatório dos testes

```bash
npm run test:report
```

## Ambientes

### Produção (padrão)

```bash
npm test
# ou
npm run test:prod
```

- URL: https://iris-produtividade-app.vercel.app/

### Desenvolvimento

```bash
npm run test:dev
```
