import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import History from '../../pages/History';
import { MemoryRouter } from 'react-router-dom';

// Mock react-router-dom with virtual: true to avoid resolution issues
jest.mock('react-router-dom', () => ({
    useNavigate: () => jest.fn(),
    MemoryRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Route: () => null,
    Routes: () => null,
    Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
}), { virtual: true });

// Mock the hook
jest.mock('../../components/features/history/useHistory', () => ({
    useHistory: () => ({
        viewMode: 'cards',
        setViewMode: jest.fn(),
        assetFilter: 'all',
        setAssetFilter: jest.fn(),
        sortBy: 'date',
        setSortBy: jest.fn(),
        sortDirection: 'desc',
        setSortDirection: jest.fn(),
        items: [
            { id: 1, kind: 'single', asset: 'AAPL', algorithm: 'algo1', final_equity: 10000, created_at: '2023-01-01' }
        ],
        isLoading: false,
        isError: false,
        itemToDelete: null,
        isDeleting: false,
        handleOpenSingle: jest.fn(),
        handleOpenBatch: jest.fn(),
        handleAskDeleteSingle: jest.fn(),
        handleAskDeleteBatch: jest.fn(),
        handleCancelDelete: jest.fn(),
        handleConfirmDelete: jest.fn(),
    }),
}));

// Mock child components
jest.mock('../../components/features/history/HistoryHeader', () => ({ __esModule: true, HistoryHeader: ({ viewMode }: any) => <div data-testid="history-header">Header: {viewMode}</div> }));
jest.mock('../../components/features/history/HistoryFilters', () => ({ __esModule: true, HistoryFilters: () => <div data-testid="history-filters">Filters</div> }));
jest.mock('../../components/features/history/HistoryGrid', () => ({ __esModule: true, HistoryGrid: ({ items }: any) => <div data-testid="history-grid">Grid Items: {items.length}</div> }));
jest.mock('../../components/features/history/HistoryTable', () => ({ __esModule: true, HistoryTable: ({ items }: any) => <div data-testid="history-table">Table Items: {items.length}</div> }));

test('renders History page with content', () => {
    render(
        <MemoryRouter>
            <History />
        </MemoryRouter>
    );
    expect(screen.getByTestId('history-header')).toBeInTheDocument();
    expect(screen.getByTestId('history-filters')).toBeInTheDocument();
    expect(screen.getByTestId('history-grid')).toHaveTextContent('Grid Items: 1');
});
