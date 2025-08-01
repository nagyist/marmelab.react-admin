import * as React from 'react';
import { QueryClient } from '@tanstack/react-query';
import { CoreAdmin } from '../../core/CoreAdmin';
import { Resource } from '../../core/Resource';
import { ShowBase } from '../../controller/show/ShowBase';
import { TestMemoryRouter } from '../../routing';
import { ReferenceManyFieldBase } from './ReferenceManyFieldBase';
import { ListBase, ListIterator, useListContext } from '../list';
import fakeRestDataProvider from 'ra-data-fakerest';

export default {
    title: 'ra-core/controller/field/ReferenceManyFieldBase',
    excludeStories: ['dataProviderWithAuthors'],
};

const author = {
    id: 1,
    first_name: 'Leo',
    last_name: 'Tolstoy',
    language: 'Russian',
};

const books = [
    {
        id: 1,
        title: 'War and Peace',
        author: 1,
    },
    {
        id: 2,
        title: 'Anna Karenina',
        author: 1,
    },
    {
        id: 3,
        title: 'The Kreutzer Sonata',
        author: 1,
    },
    {
        id: 4,
        author: 2,
        title: 'Hamlet',
    },
];

export const dataProviderWithAuthors = {
    getOne: async () => ({ data: author }),
    getMany: async (_resource, params) => ({
        data: books.filter(book => params.ids.includes(book.author)),
    }),
    getManyReference: async (_resource, params) => {
        const result = books.filter(book => book.author === params.id);
        return {
            data: result.slice(
                (params.pagination.page - 1) * params.pagination.perPage,
                (params.pagination.page - 1) * params.pagination.perPage +
                    params.pagination.perPage
            ),
            total: result.length,
        };
    },
} as any;

export const Basic = ({ dataProvider = dataProviderWithAuthors }) => (
    <TestMemoryRouter initialEntries={['/authors/1/show']}>
        <CoreAdmin
            dataProvider={dataProvider}
            queryClient={
                new QueryClient({
                    defaultOptions: {
                        queries: {
                            retry: false,
                        },
                    },
                })
            }
        >
            <Resource name="books" />
            <Resource
                name="authors"
                show={
                    <ShowBase>
                        <ReferenceManyFieldBase
                            target="author"
                            source="id"
                            reference="books"
                        >
                            <AuthorList source="title" />
                        </ReferenceManyFieldBase>
                    </ShowBase>
                }
            />
        </CoreAdmin>
    </TestMemoryRouter>
);

const dataProviderWithAuthorList = fakeRestDataProvider(
    {
        authors: [
            {
                id: 1,
                first_name: 'Leo',
                last_name: 'Tolstoy',
                language: 'Russian',
            },
            {
                id: 2,
                first_name: 'William',
                last_name: 'Shakespear',
                language: 'English',
            },
        ],
        books,
    },
    process.env.NODE_ENV === 'development'
);

export const InAList = ({ dataProvider = dataProviderWithAuthorList }) => (
    <TestMemoryRouter initialEntries={['/authors']}>
        <CoreAdmin
            dataProvider={dataProvider}
            queryClient={
                new QueryClient({
                    defaultOptions: {
                        queries: {
                            retry: false,
                        },
                    },
                })
            }
        >
            <Resource
                name="authors"
                list={
                    <ListBase>
                        <ListIterator
                            render={author => (
                                <div>
                                    <h3>{author.last_name} Books</h3>
                                    <ReferenceManyFieldBase
                                        target="author"
                                        source="id"
                                        reference="books"
                                    >
                                        <AuthorList source="title" />
                                    </ReferenceManyFieldBase>
                                </div>
                            )}
                        ></ListIterator>
                    </ListBase>
                }
            />
        </CoreAdmin>
    </TestMemoryRouter>
);

const dataProviderWithAuthorsError = {
    getOne: () =>
        Promise.resolve({
            data: {
                id: 1,
                title: 'War and Peace',
                author: 1,
                summary:
                    "War and Peace broadly focuses on Napoleon's invasion of Russia, and the impact it had on Tsarist society. The book explores themes such as revolution, revolution and empire, the growth and decline of various states and the impact it had on their economies, culture, and society.",
                year: 1869,
            },
        }),
    getMany: (_resource, params) =>
        Promise.resolve({
            data: books.filter(book => params.ids.includes(book.author)),
        }),
    getManyReference: _resource => Promise.reject(new Error('Error')),
} as any;

export const Errored = ({ dataProvider = dataProviderWithAuthorsError }) => (
    <TestMemoryRouter initialEntries={['/books/1/show']}>
        <CoreAdmin
            dataProvider={dataProvider}
            queryClient={
                new QueryClient({
                    defaultOptions: {
                        queries: {
                            retry: false,
                        },
                    },
                })
            }
        >
            <Resource name="authors" />
            <Resource
                name="books"
                show={
                    <ShowBase>
                        <ReferenceManyFieldBase
                            reference="authors"
                            target="id"
                            source="author"
                        >
                            <AuthorList source="first_name" />
                        </ReferenceManyFieldBase>
                    </ShowBase>
                }
            />
        </CoreAdmin>
    </TestMemoryRouter>
);

const dataProviderWithAuthorsLoading = {
    getOne: () =>
        Promise.resolve({
            data: author,
        }),

    getMany: (_resource, params) =>
        Promise.resolve({
            data: books.filter(book => params.ids.includes(book.author)),
        }),
    getManyReference: _resource => new Promise(() => {}),
} as any;

export const Loading = ({ dataProvider = dataProviderWithAuthorsLoading }) => (
    <TestMemoryRouter initialEntries={['/books/1/show']}>
        <CoreAdmin
            dataProvider={dataProvider}
            queryClient={
                new QueryClient({
                    defaultOptions: {
                        queries: {
                            retry: false,
                        },
                    },
                })
            }
        >
            <Resource name="authors" />
            <Resource
                name="books"
                show={
                    <ShowBase>
                        <ReferenceManyFieldBase
                            reference="authors"
                            target="id"
                            source="author"
                        >
                            <AuthorList source="first_name" />
                        </ReferenceManyFieldBase>
                    </ShowBase>
                }
            />
        </CoreAdmin>
    </TestMemoryRouter>
);

export const WithRenderProp = ({
    dataProvider = dataProviderWithAuthors,
}: {
    dataProvider?: any;
}) => (
    <TestMemoryRouter initialEntries={['/books/1/show']}>
        <CoreAdmin
            dataProvider={dataProvider}
            queryClient={
                new QueryClient({
                    defaultOptions: {
                        queries: {
                            retry: false,
                        },
                    },
                })
            }
        >
            <Resource name="authors" />
            <Resource
                name="books"
                show={
                    <ShowBase>
                        <ReferenceManyFieldBase
                            reference="books"
                            target="author"
                            source="id"
                            render={({ error, isPending, data }) => {
                                if (isPending) {
                                    return <p>Loading...</p>;
                                }

                                if (error) {
                                    return (
                                        <p style={{ color: 'red' }}>
                                            {error.message}
                                        </p>
                                    );
                                }
                                return (
                                    <p>
                                        {data?.map((datum, index) => (
                                            <li key={index}>{datum.title}</li>
                                        ))}
                                    </p>
                                );
                            }}
                        />
                    </ShowBase>
                }
            />
        </CoreAdmin>
    </TestMemoryRouter>
);

const AuthorList = ({ source }) => {
    const { isPending, error, data } = useListContext();

    if (isPending) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p style={{ color: 'red' }}>{error.toString()}</p>;
    }
    return (
        <p>
            {data?.map((datum, index) => <li key={index}>{datum[source]}</li>)}
        </p>
    );
};
