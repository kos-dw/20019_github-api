// 失敗を型で表現する。throw に依存せず、処理漏れをコンパイル時に検出する。

export type Ok<T> = { readonly ok: true; readonly val: T };
export type Err<E> = { readonly ok: false; readonly err: E };
export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T>(val: T): Ok<T> => ({ ok: true, val });
export const err = <E>(err: E): Err<E> => ({ ok: false, err });
