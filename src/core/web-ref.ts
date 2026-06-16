import { Type } from "@angular/core";
import { WebLocalStorage } from "../services/web-local-storage.js";
import { getService } from "./web-injector.js";

/**
 * Objeto utilitário recebido pela factory de `webProvider`.
 *
 * Use `ref.inject(...)` para acessar serviços Angular dentro do provider e
 * `ref.storage` para acessar o storage configurado pela lib.
 *
 * @example
 * export const userProvider = webProvider('user', (ref: WebRef) => {
 *   const api = ref.inject(UserApiService);
 *   return new UserProvider(api, ref.storage);
 * });
 */
export class WebRef {
  constructor(private instances: Map<string, unknown>) { }

  /**
   * Retorna uma instância singleton associada a uma chave interna.
   *
   * @example
   * const cache = ref.get('cache', () => new Map())
   */
  get<T>(key: string, factory: () => T): T {
    if (!this.instances.has(key)) {
      this.instances.set(key, factory());
    }
    return this.instances.get(key) as T;
  }

  /**
   * Injeta um serviço registrado no injector Angular da aplicação.
   *
   * @example
   * const http = ref.inject(HttpClient)
   */
  inject<T>(token: Type<T>): T {
    return getService(token);
  }

  /**
   * Acesso ao serviço de persistência configurado pela lib.
   *
   * @example
   * ref.storage.setItem('draft', draft)
   */
  get storage() { return this.inject(WebLocalStorage); }
}
