export type WebStorageType = "localStorage" | "sessionStorage" | "memory";

export interface StorageProviderOptions {
  /**
   * Storage usado para persistir o estado dos providers.
   *
   * @default 'localStorage'
   *
   * @example
   * provideWebProviderInitializer({ storage: 'sessionStorage' })
   */
  type?: WebStorageType;

  /**
   * Prefixo aplicado em todas as chaves persistidas.
   * Use para evitar colisões com outras libs ou apps no mesmo domínio.
   *
   * @default 'web-provider-app'
   *
   * @example
   * provideWebProviderInitializer({ keyPrefix: 'my_app' })
   */
  prefix?: string;
}

export interface WebProviderOptions {
  /**
   * Tempo de vida do provider em milissegundos.
   *
   * @example
   * webProvider('cart', createCartProvider, { ttl: 60_000 })
   */
  ttl?: number;

  /**
   * Remove o estado persistido quando o provider expira por TTL.
   *
   * @example
   * webProvider('session', createSessionProvider, { ttl: 300_000, clearStorageOnExpire: true })
   */
  clearStorageOnExpire?: boolean;

  /**
   * Carrega o estado persistido imediatamente durante a criação do provider.
   * Se ficar false, o estado é carregado de forma assíncrona no próximo ciclo.
   *
   * @example
   * provideWebProviderInitializer({ syncStorage: true })
   */
  syncStorage?: boolean;
}

export interface WebGlobalOptions extends WebProviderOptions {
  /**
   * Configura o tipo de storage usado para persistência.
   *
   * @default 'localStorage'
   *
   * @example
   * provideWebProviderInitializer({ storage: { type: 'sessionStorage', prefix: 'my_app' } })
   */
  storage?: StorageProviderOptions;

  /**
   * Reservado para integrações avançadas de change detection.
   */
  zoneChangeDetection?: boolean;
}

export interface ProviderMetadata {
  createdAt: number;
  factory: (ref: any) => any;
  options: WebProviderOptions;
}

export const providerMetadataMap = new Map<string, ProviderMetadata>();
const defaultGlobalOptions: Required<Pick<WebGlobalOptions, "storage">> = {
  storage: {
    type: "localStorage",
    prefix: "web-provider-app",
  },
};

let globalOptions: WebGlobalOptions = { ...defaultGlobalOptions };
export const getGlobalOptions = () => globalOptions;

export const setGlobalOptions = (options: WebGlobalOptions) => {
  globalOptions = { ...defaultGlobalOptions, ...options };
};
