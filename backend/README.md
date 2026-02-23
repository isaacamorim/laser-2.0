# 📘 DOCUMENTAÇÃO TÉCNICA

## Backend — Módulo Laser

**Versão 2.0 | Fevereiro 2026**
Flask · Oracle DB · Python 3.11+

---

## 1. Visão Geral

Este documento descreve a arquitetura, organização de arquivos, endpoints disponíveis, fluxo de dados e convenções de código do backend do Módulo Laser — sistema de apontamento de produção integrado ao banco Oracle.

### 1.1 Tecnologias Utilizadas

| Tecnologia  | Versão / Detalhe | Função              |
| ----------- | ---------------- | ------------------- |
| Python      | 3.11+            | Linguagem principal |
| Flask       | 3.x              | Framework web       |
| Flask-CORS  | —                | Controle de origens |
| Flask-Login | —                | Autenticação        |
| oracledb    | —                | Driver Oracle       |
| Oracle DB   | 19c+             | Banco relacional    |

---

## 2. Estrutura de Arquivos

```
backend/
├── app.py
├── core/
│   ├── database.py
│   └── exceptions.py
├── modules/
│   ├── api/
│   │   └── routes.py
│   └── laser/
│       ├── routes.py
│       ├── service.py
│       ├── repository.py
│       └── schemas.py
└── shared/
    └── utils.py
```

### 2.1 Responsabilidade das Camadas

| Camada     | Responsabilidade | Não Deve Fazer |
| ---------- | ---------------- | -------------- |
| routes     | Receber requests | SQL / regras   |
| service    | Regras           | Flask / SQL    |
| repository | Queries          | Regras         |
| schemas    | Validação        | Banco          |
| core       | Infra            | Negócio        |

---

## 3. Configuração do Banco

### 3.1 Variáveis de Ambiente

| Variável   | Padrão       | Descrição |
| ---------- | ------------ | --------- |
| DB_USER    | SYSALL       | Usuário   |
| DB_PASS    | LEGEND       | Senha     |
| DB_HOST    | 10.42.92.200 | Host      |
| DB_PORT    | 1521         | Porta     |
| DB_SERVICE | ORCL         | Serviço   |

### 3.2 Modos Oracle

* **Thick Mode**: com client
* **Thin Mode**: driver puro

Importação padrão:

```python
from core.database import get_connection
```

---

## 4. Hierarquia de Exceções

```
AppError
├── ValidationError (400)
├── NotFoundError (404)
├── ConflictError (409)
└── DatabaseError (500)
```

---

## 5. Endpoints

### 5.1 Laser — /api/laser

#### GET /sequencing_v2

Retorna OFs do operador.

**Parâmetro:** operator_code

#### GET /download_step

Download de arquivo .step

#### POST /submit_apontamento

Registra apontamento direto

#### POST /apontamento/start

Inicia apontamento

#### POST /apontamento/pause

Pausa apontamento

#### POST /apontamento/finish

Finaliza apontamento

#### GET /apontamento/list/<of_id>

Lista apontamentos

#### POST /apontamento/confirm_batch

Confirma lote

---

### 5.2 Rotas Gerais — /api

* GET /api/laser/sequenciamento
* GET /api/operadores/<codigo>
* GET /api/laser/jobs

---

## 6. Fluxo de Apontamento

```
Frontend → Backend → Oracle
/start → INSERT A
/pause → UPDATE
/finish → UPDATE C
```

---

## 7. Convenções

### 7.1 Importações

| Arquivo    | Pode Importar  |
| ---------- | -------------- |
| routes     | flask, service |
| service    | repository     |
| repository | core.database  |
| schemas    | exceptions     |

### 7.2 Erros

Sempre capturar AppError primeiro.

### 7.3 Banco

Sempre fechar conexão.

### 7.4 Datas

| Campo       | Formato             |
| ----------- | ------------------- |
| data_inicio | YYYY-MM-DD HH:MM:SS |
| total_time  | HH:MM:SS.ffffff     |

---

## 8. Inicialização (app.py)

| Blueprint | Prefixo    |
| --------- | ---------- |
| api_bp    | /api       |
| laser_bp  | /api/laser |

Servidor: `0.0.0.0:5050`

---

## 9. Segurança

* Middleware de permissão
* Proteção path traversal
* Credenciais por env
* Transações controladas

---

## 10. Novas Rotas

1. schemas
2. repository
3. service
4. routes

---

**Documento Técnico — Fevereiro 2026**
