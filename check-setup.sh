#!/bin/bash

# Script para testar a configuração dos testes de API

echo "🚀 Iniciando verificação dos testes de API..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js primeiro."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale o npm primeiro."
    exit 1
fi

echo "✅ Node.js e npm encontrados"

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

echo "✅ Dependências verificadas"

# Listar os testes para verificar se estão sendo detectados
echo "📋 Listando testes disponíveis..."
npx playwright test --list | grep -E "(auth|API)"

echo ""
echo "🎯 Configuração dos testes concluída!"
echo ""
echo "Para executar os testes, use os seguintes comandos:"
echo "  npm test                    # Executar todos os testes (produção)"
echo "  npm run test:auth          # Executar apenas testes de auth"
echo "  npm run test:ui            # Executar com interface visual"
echo "  npm run test:debug         # Executar em modo debug"
echo "  npm run test:dev           # Executar contra localhost:3000"
echo ""
echo "✅ Os testes estão configurados para rodar contra a API de produção:"
echo "   https://iris-produtividade-app.vercel.app/"
echo ""
echo "💡 Para testar contra localhost, use: npm run test:dev"