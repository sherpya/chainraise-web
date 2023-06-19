import type {
    QueryFunctionContext,
    UseQueryOptions
} from '@tanstack/react-query';


export type QueryFunctionArgs<T extends (...args: any) => any> =
    QueryFunctionContext<ReturnType<T>>;


export type QueryConfig<TData, TError, TSelectData = TData> = Pick<
    UseQueryOptions<TData, TError, TSelectData>,
    | 'cacheTime'
    | 'enabled'
    | 'isDataEqual'
    | 'staleTime'
    | 'structuralSharing'
    | 'suspense'
    | 'onError'
    | 'onSettled'
    | 'onSuccess'
> & {
    /** Scope the cache to a given context. */
    scopeKey?: string;
};
