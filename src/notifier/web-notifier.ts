import { BehaviorSubject, distinctUntilChanged, map, Observable } from "rxjs";
import { WebLocalStorage } from "../services/web-local-storage.js";
import { computed, inject, signal, Signal, untracked, WritableSignal } from "@angular/core";
import { getCurrentChangeDetector } from "../core/web-injector.js";

type StatePredicate<T> = (newValue: unknown, state: T) => T | null | undefined;

/**
 * Classe base mínima para providers gerenciados por `webProvider`.
 */
export class WebNotifier {
  protected key: string = new Date().getTime().toString();
}

/**
 * Provider baseado em RxJS.
 *
 * Use `setState` dentro da sua classe para atualizar o estado e `state$`,
 * `select` ou `snapshot` para consumir os dados.
 *
 * @example
 * interface UserState { name: string }
 *
 * class UserProvider extends WebNotifierProvider<UserState> {
 *   constructor() {
 *     super({ name: '' });
 *   }
 *
 *   setName(name: string) {
 *     this.setState({ name });
 *   }
 * }
 */
export abstract class WebNotifierProvider<T> extends WebNotifier {
  private saveTimeout?: any;
  protected subject: BehaviorSubject<T>;
  public readonly state$: Observable<T>;

  private syncPredicate?: StatePredicate<T>;

  protected storage = inject(WebLocalStorage);

  constructor(initialState: T) {
    super();
    this.subject = new BehaviorSubject<T>(initialState);
    this.state$ = this.subject.asObservable();
  }

  protected _init(key: string) {
    this.key = key;

    const cached = this.storage.getItem<T>(key, null);
    if (cached !== null) {
      this.subject.next(cached);
    }
  }

  protected init(key: string, syncStorage: boolean = false) {
    this.key = key;

    if (syncStorage) this.loadCache(key);
    else setTimeout(() => { this.loadCache(key); }, 0);
  }

  private loadCache(key: string) {
    try {
      const cached = this.storage.getItem<T>(key, null);
      if (cached !== null) {
        this.subject.next(cached);

        const componentCdr = getCurrentChangeDetector();
        if (componentCdr) {
          componentCdr.markForCheck();
        }
      }
    } catch (_error) {
    }
  }

  /**
   * Define uma função que transforma eventos externos em estado.
   *
   * @example
   * this.predicate((event, state) => ({ ...state, updatedAt: Date.now() }))
   */
  public predicate(predicate: StatePredicate<T>) {
    this.syncPredicate = predicate;
  }

  protected setStatePredicate(item: unknown) {
    const state = this.syncPredicate?.(item, this.snapshot);
    if (state) this.setState(state);
  }

  protected _setState(patch: Partial<T> | ((state: T) => Partial<T>)) {
    const current = this.subject.getValue();
    const result = typeof patch === 'function' ? patch(current) : patch;

    const next = (typeof current === 'object' && current !== null)
      ? { ...current, ...result } as T
      : result as T;

    this.subject.next(next);

    if (this.key) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => {
        this.storage.setItem(this.key, next);
      }, 500);
    }
  }

  protected setState(patch: Partial<T> | ((state: T) => Partial<T>)) {
    untracked(() => {
      const current = this.subject.getValue();
      const result = typeof patch === 'function' ? patch(current) : patch;

      const next = (typeof current === 'object' && current !== null)
        ? { ...current, ...result } as T
        : result as T;

      this.persist(next);
    });
  }

  private persist(nextState: T) {
    this.subject.next(nextState);

    if (this.key) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => {
        this.storage.setItem(this.key, nextState);
      }, 500);
    }
  }

  /**
   * Retorna uma fatia reativa do estado como Observable.
   *
   * @example
   * readonly name$ = this.select((state) => state.name)
   */
  public select<K>(fn: (state: T) => K): Observable<K> {
    return this.state$.pipe(
      map(fn),
      distinctUntilChanged()
    );
  }

  protected getState(): T {
    return this.subject.getValue();
  }

  /**
   * Snapshot síncrono do estado atual.
   *
   * @example
   * const currentUser = userProvider.snapshot
   */
  public get snapshot(): T {
    return this.subject.getValue();
  }

  destroy() {
    this.subject.complete();
  }
}

/**
 * Provider baseado em Angular Signals.
 *
 * Use quando o consumo principal do estado for feito por signals em componentes.
 *
 * @example
 * class CounterProvider extends WebNotifierSignalProvider<{ count: number }> {
 *   constructor() {
 *     super({ count: 0 });
 *   }
 *
 *   increment() {
 *     this.setState((state) => ({ count: state.count + 1 }));
 *   }
 * }
 */
export abstract class WebNotifierSignalProvider<T> extends WebNotifier {
  private saveTimeout?: any;

  protected subject: BehaviorSubject<T>;
  public readonly state$: Observable<T>;

  protected readonly stateSignal: WritableSignal<T>;
  public readonly snapshot: WritableSignal<T>;

  protected storage = inject(WebLocalStorage);

  constructor(initialState: T) {
    super();
    this.snapshot = this.stateSignal = signal<T>(initialState);
    this.subject = new BehaviorSubject<T>(initialState);
    this.state$ = this.subject.asObservable();
  }

  protected _init(key: string) {
    this.key = key;

    const cached = untracked(() => this.storage.getItem<T>(key, null));
    if (cached !== null) {
      untracked(() => {
        queueMicrotask(() => {
          this.stateSignal.set(cached);
          this.snapshot.set(cached);
          this.subject.next(cached);
        });
      });
    }
  }

  protected init(key: string, syncStorage: boolean = false) {
    this.key = key;

    if (syncStorage) this.loadCache(key);
    else setTimeout(() => { this.loadCache(key); }, 0);
  }

  private loadCache(key: string) {
    try {
      const cached = this.storage.getItem<T>(key, null);
      if (cached !== null) {
        this.stateSignal.set(cached);
        this.snapshot.set(cached);
        this.subject.next(cached);

        const componentCdr = getCurrentChangeDetector();
        if (componentCdr) {
          componentCdr.markForCheck();
        }
      }

    } catch (_error) {

    }
  }

  protected setStateX(patch: Partial<T> | ((state: T) => Partial<T>)) {
    this.stateSignal.update((current) => {
      const result = typeof patch === 'function' ? patch(current) : patch;

      const next = (typeof current === 'object' && current !== null)
        ? { ...current, ...result } as T
        : result as T;

      this.persist(next);

      return next;
    });
    const componentCdr = getCurrentChangeDetector();
    if (componentCdr) {
      componentCdr.markForCheck();
    }
  }

  protected _setState(patch: Partial<T> | ((state: T) => Partial<T>)) {
    untracked(() => {
      queueMicrotask(() => {
        this.stateSignal.update((current) => {
          const result = typeof patch === 'function' ? patch(current) : patch;
          const next = (typeof current === 'object' && current !== null)
            ? { ...current, ...result } as T
            : result as T;

          this.persist(next);
          return next;
        });
      });
    });
  }

  protected setState(patch: Partial<T> | ((state: T) => Partial<T>)) {
    untracked(() => {
      this.stateSignal.update((current) => {
        const result = typeof patch === 'function' ? patch(current) : patch;
        const next = (typeof current === 'object' && current !== null)
          ? { ...current, ...result } as T
          : result as T;

        this.persist(next);
        return next;
      });
    });
  }

  /**
   * Retorna uma fatia do estado como Angular Signal.
   *
   * @example
   * readonly count = this.select((state) => state.count)
   */
  public select<K>(fn: (state: T) => K): Signal<K> {
    return computed(() => fn(this.stateSignal()));
  }

  /**
   * Snapshot síncrono do valor atual do signal.
   *
   * @example
   * const currentCount = counterProvider.snapshotx
   */
  public get snapshotx(): T {
    return this.stateSignal();
  }

  destroy() {
    this.subject.complete();
  }

  private persist(nextState: T) {
    this.subject.next(nextState);

    if (this.key) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => {
        this.storage.setItem(this.key, nextState);
      }, 500);
    }
  }
}
