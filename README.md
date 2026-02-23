# 📘 DOCUMENTAÇÃO GERAL

## Sistema de Apontamento Laser 2.0

Versão: 2.0
Data: Fevereiro 2026
Autor: Isaac Vinícius de Carvalho

---

# 1. Visão Geral do Projeto

O **Laser 2.0** é um sistema web para controle e apontamento de produção industrial, integrado ao banco de dados Oracle da empresa.

O sistema permite:

* Identificação do operador
* Visualização de ordens de fabricação (OFs)
* Controle de início, pausa e finalização da produção
* Registro automático no banco
* Consulta de histórico
* Download de arquivos técnicos (.step)

O projeto foi desenvolvido com foco em:

* Estabilidade
* Simplicidade operacional
* Facilidade de manutenção
* Uso em ambiente industrial

---

# 2. Arquitetura Geral

O sistema segue uma arquitetura cliente-servidor:

```
[ Navegador (Frontend) ]  ⇄  [ Backend Flask ]  ⇄  [ Oracle Database ]
```

Componentes:

| Camada   | Tecnologia     | Função                |
| -------- | -------------- | --------------------- |
| Frontend | HTML, CSS, JS  | Interface do operador |
| Backend  | Python + Flask | Regras e integração   |
| Banco    | Oracle 19c+    | Persistência de dados |

---

# 3. Estrutura de Diretórios do Projeto

```
laser-2.0/
│
├── backend/
│   ├── app.py
│   ├── core/
│   ├── modules/
│   └── shared/
│
├── frontend/
│   ├── index.html
│   ├── css/
│   └── js/
│
├── .venv/
├── .vscode/
├── README.md
└── docs/
```

---

# 4. Módulos Principais

## 4.1 Frontend

Responsável pela interação com o operador.

Principais funções:

* Login
* Dashboard de OFs
* Tela de apontamento
* Modais e alertas

Arquivos principais:

* main.js
* auth.js
* dashboard.js
* apontamento.js
* ui.js

---

## 4.2 Backend

Responsável pela lógica de negócio e comunicação com o banco.

Principais funções:

* Validação de dados
* Controle de apontamento
* Execução de queries
* Exposição da API REST

Framework: Flask

---

## 4.3 Banco de Dados

Banco relacional Oracle.

Principais tabelas utilizadas:

* S_APONTAMENTO_OF
* J_OF
* J_PRODUTO
* J_COLAB
* I_SEQ_OF_COLAB

Principais views:

* ALJ_V_OF_COM_SALDO
* VW_APONTAMENTO_LASER

---

# 5. Fluxo Operacional do Sistema

## 5.1 Fluxo do Operador

```
Login → Dashboard → Seleção da OF → Apontamento → Finalização
```

Etapas:

1. Operador informa código
2. Sistema carrega OFs
3. Operador seleciona OF
4. Inicia produção
5. Pausa ou finaliza
6. Dados são gravados no banco

---

## 5.2 Fluxo Técnico

```
Frontend → API → Service → Repository → Oracle
```

Todas as operações passam pelas camadas definidas.

---

# 6. Configuração do Ambiente

## 6.1 Requisitos

* Python 3.11+
* Oracle Client (opcional)
* Navegador moderno
* Acesso à rede interna

---

## 6.2 Variáveis de Ambiente

| Variável   | Descrição      |
| ---------- | -------------- |
| DB_USER    | Usuário Oracle |
| DB_PASS    | Senha          |
| DB_HOST    | Servidor       |
| DB_PORT    | Porta          |
| DB_SERVICE | Serviço        |

---

## 6.3 Instalação Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python backend/app.py
```

---

## 6.4 Execução Frontend

O frontend é servido via servidor web interno ou diretamente pelo Flask.

Acesso padrão:

```
http://<servidor>:5050
```

---

# 7. Segurança

Medidas adotadas:

* Validação de entrada
* Controle de permissões
* Proteção contra path traversal
* Variáveis de ambiente
* Isolamento de banco

Recomenda-se:

* Backup diário
* Controle de acesso por rede
* Monitoramento de logs

---

# 8. Manutenção

## 8.1 Rotina Recomendada

| Frequência | Ação                     |
| ---------- | ------------------------ |
| Diária     | Verificar logs           |
| Semanal    | Backup                   |
| Mensal     | Atualização dependências |
| Anual      | Auditoria técnica        |

---

## 8.2 Atualização do Sistema

1. Criar backup
2. Atualizar código
3. Testar em homologação
4. Publicar em produção

Nunca atualizar diretamente em produção.

---

# 9. Boas Práticas do Projeto

* Código modular
* Separação de camadas
* Documentação atualizada
* Versionamento Git
* Testes manuais periódicos

---

# 10. Expansões Futuras

Funcionalidades planejadas:

* Dashboard gerencial
* Relatórios automáticos
* Integração ERP
* Modo offline
* Auditoria avançada
* Controle multi-turno

---

# 11. Suporte e Responsabilidade

Responsável técnico:

Isaac Vinícius de Carvalho

Contato interno conforme política da empresa.

---

# 12. Histórico de Versões

| Versão | Data | Descrição           |
| ------ | ---- | ------------------- |
| 1.0    | 2024 | Versão inicial      |
| 2.0    | 2026 | Arquitetura modular |

---

Documento Geral do Projeto — Laser 2.0
