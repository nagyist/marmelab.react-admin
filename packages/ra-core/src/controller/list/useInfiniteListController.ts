import { isValidElement, useEffect, useMemo } from 'react';
import type {
    InfiniteQueryObserverBaseResult,
    InfiniteData,
} from '@tanstack/react-query';

import { useAuthenticated, useRequireAccess } from '../../auth';
import { useTranslate } from '../../i18n';
import { useNotify } from '../../notification';
import { useInfiniteGetList } from '../../dataProvider';
import { defaultExporter } from '../../export';
import { useResourceContext, useGetResourceLabel } from '../../core';
import { useRecordSelection } from './useRecordSelection';
import { useListParams } from './useListParams';
import { useSelectAll } from './useSelectAll';
import type { UseInfiniteGetListOptions } from '../../dataProvider';
import type { ListControllerResult } from './useListController';
import type {
    RaRecord,
    SortPayload,
    FilterPayload,
    Exporter,
    GetInfiniteListResult,
} from '../../types';

/**
 * Prepare data for the InfiniteList view
 *
 * @param {Object} props The props passed to the InfiniteList component.
 *
 * @return {Object} controllerProps Fetched and computed data for the List view
 *
 * @example
 *
 * import { useInfiniteListController } from 'react-admin';
 * import ListView from './ListView';
 *
 * const MyList = props => {
 *     const controllerProps = useInfiniteListController(props);
 *     return <ListView {...controllerProps} {...props} />;
 * }
 */
export const useInfiniteListController = <
    RecordType extends RaRecord = any,
    ErrorType = Error,
>(
    props: InfiniteListControllerProps<RecordType, ErrorType> = {}
): InfiniteListControllerResult<RecordType, ErrorType> => {
    const {
        debounce = 500,
        disableAuthentication = false,
        disableSyncWithLocation = false,
        exporter = defaultExporter,
        filter,
        filterDefaultValues,
        perPage = 10,
        queryOptions,
        sort,
        storeKey,
    } = props;
    const resource = useResourceContext(props);
    const { meta, ...otherQueryOptions } = queryOptions ?? {};

    if (!resource) {
        throw new Error(
            `<InfiniteList> was called outside of a ResourceContext and without a resource prop. You must set the resource prop.`
        );
    }
    if (filter && isValidElement(filter)) {
        throw new Error(
            '<InfiniteList> received a React element as `filter` props. If you intended to set the list filter elements, use the `filters` (with an s) prop instead. The `filter` prop is internal and should not be set by the developer.'
        );
    }

    const { isPending: isPendingAuthenticated } = useAuthenticated({
        enabled: !disableAuthentication,
    });

    const { isPending: isPendingCanAccess } = useRequireAccess<RecordType>({
        action: 'list',
        resource,
        enabled: !disableAuthentication && !isPendingAuthenticated,
    });

    const translate = useTranslate();
    const notify = useNotify();

    const [query, queryModifiers] = useListParams({
        debounce,
        disableSyncWithLocation,
        filterDefaultValues,
        perPage,
        resource,
        sort,
        storeKey,
    });

    const [selectedIds, selectionModifiers] = useRecordSelection({ resource });

    const {
        data,
        total,
        error,
        isLoading,
        isPending,
        isFetching,
        hasNextPage,
        hasPreviousPage,
        fetchNextPage,
        isFetchingNextPage,
        fetchPreviousPage,
        isFetchingPreviousPage,
        refetch,
        meta: responseMeta,
    } = useInfiniteGetList<RecordType, ErrorType>(
        resource,
        {
            pagination: {
                page: query.page,
                perPage: query.perPage,
            },
            sort: { field: query.sort, order: query.order },
            filter: { ...query.filter, ...filter },
            meta,
        },
        {
            enabled:
                (!isPendingAuthenticated && !isPendingCanAccess) ||
                disableAuthentication,
            placeholderData: previousData => previousData,
            retry: false,
            onError: error =>
                notify(
                    (error as Error)?.message || 'ra.notification.http_error',
                    {
                        type: 'error',
                        messageArgs: {
                            _: (error as Error)?.message,
                        },
                    }
                ),
            ...otherQueryOptions,
        }
    );

    const onSelectAll = useSelectAll({
        resource,
        sort: { field: query.sort, order: query.order },
        filter: { ...query.filter, ...filter },
    });

    // change page if there is no data
    useEffect(() => {
        if (
            query.page <= 0 ||
            (!isFetching &&
                query.page > 1 &&
                (data == null || data?.pages.length === 0))
        ) {
            // Query for a page that doesn't exist, set page to 1
            queryModifiers.setPage(1);
            return;
        }
        if (total == null) {
            return;
        }
        const totalPages = Math.ceil(total / query.perPage) || 1;
        if (!isFetching && query.page > totalPages) {
            // Query for a page out of bounds, set page to the last existing page
            // It occurs when deleting the last element of the last page
            queryModifiers.setPage(totalPages);
        }
    }, [isFetching, query.page, query.perPage, data, queryModifiers, total]);

    const currentSort = useMemo(
        () => ({
            field: query.sort,
            order: query.order,
        }),
        [query.sort, query.order]
    );

    const getResourceLabel = useGetResourceLabel();
    const defaultTitle = translate(`resources.${resource}.page.list`, {
        _: translate('ra.page.list', {
            name: getResourceLabel(resource, 2),
        }),
    });

    const unwrappedData = useMemo(
        () => data?.pages?.reduce((acc, page) => [...acc, ...page.data], []),
        [data]
    );

    return {
        sort: currentSort,
        data: unwrappedData,
        defaultTitle,
        displayedFilters: query.displayedFilters,
        error,
        exporter,
        filter,
        filterValues: query.filterValues,
        hideFilter: queryModifiers.hideFilter,
        isFetching,
        isLoading,
        isPending,
        onSelect: selectionModifiers.select,
        onSelectAll,
        onToggleItem: selectionModifiers.toggle,
        onUnselectItems: selectionModifiers.clearSelection,
        page: query.page,
        perPage: query.perPage,
        refetch,
        resource,
        selectedIds,
        setFilters: queryModifiers.setFilters,
        setPage: queryModifiers.setPage,
        setPerPage: queryModifiers.setPerPage,
        setSort: queryModifiers.setSort,
        showFilter: queryModifiers.showFilter,
        total: total,
        hasNextPage,
        hasPreviousPage,
        fetchNextPage,
        isFetchingNextPage,
        fetchPreviousPage,
        isFetchingPreviousPage,
        meta: responseMeta,
    } as InfiniteListControllerResult<RecordType, ErrorType>;
};

export interface InfiniteListControllerProps<
    RecordType extends RaRecord = any,
    ErrorType = Error,
> {
    debounce?: number;
    disableAuthentication?: boolean;
    /**
     * Whether to disable the synchronization of the list parameters with the current location (URL search parameters)
     */
    disableSyncWithLocation?: boolean;
    exporter?: Exporter | false;
    filter?: FilterPayload;
    filterDefaultValues?: object;
    perPage?: number;
    queryOptions?: UseInfiniteGetListOptions<RecordType, ErrorType>;
    resource?: string;
    sort?: SortPayload;
    storeKey?: string | false;
}

export type InfiniteListControllerResult<
    RecordType extends RaRecord = any,
    ErrorType = Error,
> = ListControllerResult<RecordType> & {
    fetchNextPage: InfiniteQueryObserverBaseResult<
        InfiniteData<GetInfiniteListResult<RecordType>>,
        ErrorType
    >['fetchNextPage'];
    fetchPreviousPage: InfiniteQueryObserverBaseResult<
        InfiniteData<GetInfiniteListResult<RecordType>>,
        ErrorType
    >['fetchPreviousPage'];
    isFetchingNextPage: InfiniteQueryObserverBaseResult<
        InfiniteData<GetInfiniteListResult<RecordType>>,
        ErrorType
    >['isFetchingNextPage'];
    isFetchingPreviousPage: InfiniteQueryObserverBaseResult<
        InfiniteData<GetInfiniteListResult<RecordType>>,
        ErrorType
    >['isFetchingPreviousPage'];
};
