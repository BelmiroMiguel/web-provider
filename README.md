# web-provider

Provider para gerenciamento, compartilhamento e persistência de estado em aplicações Angular.

O `web-provider` permite criar providers singleton reutilizáveis em toda a aplicação, com suporte a:

* Estado reativo com RxJS
* Estado reativo com Angular Signals
* Persistência automática
* Injeção de dependências Angular
* Comunicação entre providers
* TTL e expiração automática
* Storage configurável

---

# Instalação

```bash
npm install @2bbelmiro/web-provider
```

Peer dependencies:

```bash
npm install @angular/core rxjs
```

Caso utilize serviços HTTP:

```bash
npm install @angular/common
```

---

# Configuração Obrigatória

Antes de criar qualquer provider, registre o inicializador global da biblioteca.

Este é o primeiro passo obrigatório para utilizar o `web-provider`.

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideWebProviderInitializer } from '@2bbelmiro/web-provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideWebProviderInitializer(),
  ],
};
```

Configuração completa:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideWebProviderInitializer } from '@2bbelmiro/web-provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideWebProviderInitializer({
      storage: {
        type: 'localStorage',
        prefix: 'my_app',
      },
      syncStorage: true,
      zoneChangeDetection: true,
    }),
  ],
};
```

---

# Conceitos

Um provider criado com `webProvider` é um singleton global.

```text
webProvider
 ├─ Singleton
 ├─ Pode ser persistido
 ├─ Pode usar RxJS
 ├─ Pode usar Signals
 └─ Pode ser um serviço simples
```

O provider é criado apenas uma vez e pode ser acessado de qualquer lugar da aplicação.

---

# Change Detection e Zones

O `WebNotifierProvider` utiliza RxJS para notificar alterações de estado.

Em aplicações Angular tradicionais utilizando Zone.js, a interface normalmente será atualizada automaticamente quando o estado mudar.

Em aplicações utilizando modo zoneless ou estratégias avançadas de change detection, as alterações podem não refletir automaticamente na UI.

Nesses cenários você pode:

* Utilizar Angular Signals através do `WebNotifierSignalProvider`
* Disparar manualmente o change detection
* Utilizar integrações específicas de change detection

```typescript
provideWebProviderInitializer({
  zoneChangeDetection: true,
});
```

Se você utiliza `WebNotifierSignalProvider`, não é necessário depender de Zone.js para atualizar a interface, pois os Signals notificam automaticamente a UI.

---

# Provider com RxJS

Utilize `WebNotifierProvider` quando desejar um estado reativo baseado em RxJS.

```typescript
import {
  webProvider,
  WebNotifierProvider,
  WebRef,
} from 'web-provider';

interface UserState {
  name: string;
  logged: boolean;
}

class UserProvider extends WebNotifierProvider<UserState> {
  constructor() {
    super({
      name: '',
      logged: false,
    });
  }

  login(name: string) {
    this.setState({
      name,
      logged: true,
    });
  }

  logout() {
    this.setState({
      name: '',
      logged: false,
    });
  }
}

export const userProvider = webProvider(
  'user',
  (_ref: WebRef) => new UserProvider()
);
```

Uso:

```typescript
user = userProvider.snapshot;

name$ = userProvider.select(
  (state) => state.name
);

onClick() {
  userProvider.login('Belmiro');
}
```

---

# Provider com Angular Signals

Esta é a opção recomendada para aplicações Angular modernas.

Os Signals atualizam automaticamente a interface sem depender de Zone.js, oferecendo melhor performance e previsibilidade.

```typescript
import {
  webProvider,
  WebNotifierSignalProvider,
} from 'web-provider';

interface CounterState {
  count: number;
}

class CounterProvider
  extends WebNotifierSignalProvider<CounterState> {
  constructor() {
    super({
      count: 0,
    });
  }

  increment() {
    this.setState((state) => ({
      count: state.count + 1,
    }));
  }
}

export const counterProvider = webProvider(
  'counter',
  () => new CounterProvider()
);
```

Uso:

```typescript
const count = counterProvider.select(
  (state) => state.count
);

onClick() {
  counterProvider.increment();
}
```

---

# Providers sem Estado Reativo

Nem todo provider precisa herdar de:

* WebNotifierProvider
* WebNotifierSignalProvider

Quando o objetivo é apenas expor funcionalidades, serviços ou utilitários, um provider simples é suficiente.

```typescript
import { webProvider } from 'web-provider';

export const loggerProvider = webProvider(
  'logger',
  () => ({
    log(message: string) {
      console.log(message);
    },
  })
);
```

Casos comuns:

* Helpers
* API Clients
* SDK Wrappers
* Analytics
* Loggers
* Formatadores
* Utilitários

---

# Injetando Serviços Angular

A biblioteca não fornece serviços como `HttpClient`.

Você deve utilizar os serviços já configurados na sua aplicação Angular.

## Injeção via WebRef

```typescript
import {
  webProvider,
  WebRef,
} from 'web-provider';

export const accountProvider = webProvider(
  'account',
  (ref: WebRef) => {
    const accountService =
      ref.inject(AccountService);

    return new AccountProvider(
      accountService
    );
  }
);
```

---

## Injeção via inject()

Também é possível utilizar o sistema padrão do Angular diretamente dentro do provider.

```typescript
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

class AccountProvider {
  private readonly http =
    inject(HttpClient);

  getUsers() {
    return this.http.get('/api/users');
  }
}
```

---

# Acessando Outros Providers

Um provider pode acessar outro provider.

Isso permite:

* Compartilhar estado
* Reutilizar regras de negócio
* Evitar duplicação de dados

Exemplo:

```typescript
import { accountProvider } from './account.provider';

class AuthProvider {
  login() {
    const account = accountProvider.snapshot;

    console.log(account);
  }
}

ou:

class AuthProvider extends WebNotifierProvider<AuthState> {
  loadAccount() {
    const user = accountProvider.user;

    // usar o provider normalmente
  }
}
```

---

# Persistência e Storage

Por padrão, o estado é persistido utilizando `localStorage`.

Configuração padrão:

```typescript
provideWebProviderInitializer({
  storage: {
    type: 'localStorage',
    prefix: 'web-provider-app',
  },
});
```

---

## Tipos de Storage

| Tipo           | Persistência | Duração                 |
| -------------- | ------------ | ----------------------- |
| localStorage   | Navegador    | Até ser removido        |
| sessionStorage | Navegador    | Até fechar a aba        |
| memory         | Memória RAM  | Até recarregar a página |

---

## Local Storage

Os dados permanecem disponíveis mesmo após fechar e abrir o navegador novamente.

```typescript
provideWebProviderInitializer({
  storage: {
    type: 'localStorage',
    prefix: 'my_app',
  },
});
```

---

## Session Storage

Os dados permanecem disponíveis apenas enquanto a aba estiver aberta.

```typescript
provideWebProviderInitializer({
  storage: {
    type: 'sessionStorage',
    prefix: 'my_app',
  },
});
```

---

## Memory Storage

Os dados ficam apenas em memória.

Nenhum dado é salvo no navegador.

Ao atualizar a página, todos os dados são perdidos.

```typescript
provideWebProviderInitializer({
  storage: {
    type: 'memory',
  },
});
```

---

## Prefixo das Chaves

O prefixo evita conflitos entre aplicações ou bibliotecas executando no mesmo domínio.

```typescript
provideWebProviderInitializer({
  storage: {
    prefix: 'admin',
  },
});
```

Uma chave chamada:

```text
draft
```

Será armazenada como:

```text
admin:draft
```

---

# Utilizando Storage Diretamente

Não existe obrigação de utilizar estado reativo.

Se você precisa apenas persistir informações, pode utilizar o storage diretamente.

Casos comuns:

* Rascunhos
* Preferências simples
* Cache
* Último filtro utilizado
* Dados temporários

```typescript
import {
  WebLocalStorage,
  webProvider,
  WebRef,
} from 'web-provider';

export const draftProvider = webProvider(
  'draft',
  (ref: WebRef) => {
    const storage =
      ref.inject(WebLocalStorage);

    return {
      saveDraft(value: string) {
        storage.setItem(
          'draft',
          value
        );
      },

      getDraft() {
        return storage.getItem<string>(
          'draft',
          ''
        );
      },

      clearDraft() {
        storage.removeItem(
          'draft'
        );
      },
    };
  }
);
```

---

# Quando Usar Cada Tipo de Provider

| Cenário                   | Solução                   |
| ------------------------- | ------------------------- |
| Estado que afeta a UI     | WebNotifierProvider       |
| Estado baseado em Signals | WebNotifierSignalProvider |
| Apenas persistência       | WebLocalStorage           |
| Serviços                  | Provider simples          |
| Utilitários               | Provider simples          |
| SDKs                      | Provider simples          |
| Dados temporários         | Memory Storage            |

---

# TTL e Expiração

É possível definir um tempo de vida para um provider.

Após o TTL expirar, o provider será recriado automaticamente.

```typescript
export const sessionProvider =
  webProvider(
    'session',
    () => new SessionProvider(),
    {
      ttl: 300_000,
      clearStorageOnExpire: true,
    }
  );
```

---

## Opções por Provider

| Opção                | Descrição                           |
| -------------------- | ----------------------------------- |
| ttl                  | Tempo de vida em milissegundos      |
| clearStorageOnExpire | Remove estado persistido ao expirar |
| syncStorage          | Carrega storage imediatamente       |

Exemplo:

```typescript
webProvider(
  'cart',
  () => new CartProvider(),
  {
    ttl: 60_000,
    clearStorageOnExpire: true,
    syncStorage: true,
  }
);
```

---

# API Pública

| API                           | Descrição                               |
| ----------------------------- | --------------------------------------- |
| webProvider                   | Cria providers singleton                |
| provideWebProviderInitializer | Configuração global obrigatória         |
| WebNotifierProvider           | Estado reativo baseado em RxJS          |
| WebNotifierSignalProvider     | Estado reativo baseado em Signals       |
| WebRef                        | Acesso ao injector, storage e providers |
| WebLocalStorage               | Persistência configurável               |
| setGlobalOptions              | Configuração global programática        |
| WebProviderOptions            | Opções individuais dos providers        |
| WebGlobalOptions              | Configuração global                     |
| StorageProviderOptions        | Configuração de storage                 |

---

# Scripts

| Comando              | Descrição                                      |
| -------------------- | ---------------------------------------------- |
| npm run build        | Compila TypeScript para dist                   |
| npm test             | Executa testes                                 |
| npm run lint         | Verifica ESLint                                |
| npm run test:package | Compila, valida import ESM e simula pacote npm |

---

# Publicação

Antes de publicar:

```bash
npm run lint
npm test
npm run test:package
```

Publicação:

```bash
npm publish
```

O pacote publica apenas os arquivos presentes na pasta `dist`.

---

# Licença

MIT
