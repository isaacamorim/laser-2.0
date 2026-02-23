# DOCUMENTAÇÃO TÉCNICA

Frontend — Módulo Laser

Versão 2.0  |  Fevereiro 2026
HTML5 · CSS3 · JavaScript ES Modules

---

# 1. Visão Geral

O frontend do Módulo Laser é responsável pela interface do operador de produção, permitindo:

* Login por código de operador
* Visualização do sequenciamento de OFs
* Início, pausa e finalização de apontamentos
* Consulta de histórico de apontamentos

A aplicação foi construída utilizando JavaScript modular (ES Modules), com separação clara de responsabilidades entre estado global, API, UI e regras de fluxo.

---

# 2. Estrutura de Diretórios

```
frontend/
│
├── index.html
│
├── css/
│   ├── base.css
│   ├── login.css
│   ├── dashboard.css
│   └── apontamento.css
│
└── js/
    ├── main.js
    ├── state.js
    ├── api.js
    ├── auth.js
    ├── dashboard.js
    ├── apontamento.js
    └── ui.js
```

---

# 3. Arquitetura Modular

O frontend segue separação por responsabilidade:

| Arquivo        | Responsabilidade                                       |
| -------------- | ------------------------------------------------------ |
| main.js        | Ponto de entrada da aplicação                          |
| state.js       | Estado global da aplicação                             |
| api.js         | Comunicação com o backend                              |
| auth.js        | Login e identificação do operador                      |
| dashboard.js   | Tabela de OFs e carregamento de sequenciamento         |
| apontamento.js | Fluxo de apontamento (start, pause, finish)            |
| ui.js          | Componentes visuais (toast, modal, controle de botões) |

---

# 4. Fluxo Geral da Aplicação

## 4.1 Login

1. Operador informa código
2. auth.js valida entrada
3. dashboard.loadSequencing() é chamado
4. OFs são renderizadas
5. View muda para "dashboard"

---

## 4.2 Sequenciamento

Função principal:

```
loadSequencing()
```

Responsável por:

* Buscar OFs via API
* Atualizar state.allJobs
* Atualizar state.operatorName
* Chamar renderJobTable()

---

## 4.3 Abertura do Apontamento

Ao clicar em "Iniciar Apontamento":

1. dashboard.js chama openApontamento(job)
2. apontamento.js verifica apontamento ativo
3. Atualiza estado
4. Carrega histórico
5. Mostra view "apontamento"

---

## 4.4 Ciclo de Apontamento

Estados possíveis:

```
idle
started
```

Fluxo:

1. Start → apiStartApontamento()
2. Pause → apiPauseApontamento()
3. Finish → apiFinishApontamento()

Após finalizar:

* Estado volta para "idle"
* Sequenciamento pode ser recarregado

---

# 5. Estado Global (state.js)

```
state = {
    operatorCode,
    operatorName,
    allJobs,
    selectedOf,
    apontamentoState,
    apontamentoId
}
```

Regras importantes:

* Nunca manipular DOM dentro de state.js
* Nunca fazer requisições dentro de state.js
* Apenas armazenar dados

---

# 6. Comunicação com Backend

Todas as chamadas HTTP ficam isoladas em api.js.

Exemplos:

* fetchSequencing()
* apiStartApontamento()
* apiPauseApontamento()
* apiFinishApontamento()
* fetchApontamentos()

Nenhum outro módulo deve usar fetch diretamente.

---

# 7. Convenções de Código

## 7.1 Separação de Responsabilidade

* auth.js não renderiza tabela
* dashboard.js não faz login
* apontamento.js não faz fetch direto
* ui.js não contém regra de negócio

---

## 7.2 Manipulação de DOM

* Toda manipulação deve ser isolada
* Evitar estilos inline
* Preferir classes CSS

---

## 7.3 Tratamento de Erros

* showToast("error", mensagem)
* Nunca usar alert()
* Sempre capturar exceções async

---

# 8. Responsividade

A interface foi pensada para tela vertical de máquina industrial.

Regras:

* Botões grandes
* Espaçamento vertical generoso
* Fontes legíveis
* Margem lateral fixa

---

# 9. Inicialização da Aplicação

main.js é o entry point.

Na carga do DOM:

```
initAuth()
initDashboard()
initApontamento()
```

Ordem importante:

1. Login
2. Sequenciamento
3. Apontamento

---

# 10. Boas Práticas Adotadas

* ES Modules
* Sem dependência circular
* Separação de camadas
* Estado centralizado
* Backend desacoplado
* Sem uso de bibliotecas externas

---

# 11. Como Adicionar Nova Funcionalidade

Exemplo: novo botão na tela de OF

1. Criar função no dashboard.js
2. Se precisar de API → adicionar em api.js
3. Se alterar estado → atualizar state.js
4. Se alterar layout → modificar CSS correspondente

Nunca misturar responsabilidades.

---

# 12. Remoção do PDF

A versão 2.0 removeu completamente o processamento de PDF.

Benefícios:

* Menos complexidade
* Menos erros de operador
* Fluxo industrial real
* Código mais simples
* Melhor manutenção futura

---

Documentação gerada — Fevereiro 2026
