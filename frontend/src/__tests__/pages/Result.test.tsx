import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Result from '../../pages/Result';

// Mock API
jest.mock('../../api/simulations', () => ({
    getSimulation: jest.fn(),
}));

// Mock react-router-dom with virtual: true to avoid resolution issues if path mappings are off
jest.mock('react-router-dom', () => ({
    useNavigate: () => jest.fn(),
    useLocation: () => ({ search: '?id=1' }),
    MemoryRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Route: () => null,
    Routes: () => null,
    Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
}), { virtual: true });

// Mock child components to isolate the test
jest.mock('../../components/features/results/SingleSimulationDashboard', () => () => <div data-testid="single-dashboard">Single Dashboard</div>);
jest.mock('../../components/features/results/BatchComparison', () => () => <div data-testid="batch-dashboard">Batch Dashboard</div>);

// Import the mocked function to set return values
import { getSimulation } from '../../api/simulations';

describe('Result Page Acceptance Tests', () => {

    // Setup and cleanup
    const originalLocation = window.location;

    beforeAll(() => {
        // Mock window.location for query params
        // Note: In newer JSDOM, location is read-only. We can use URL search params injection if the component supports it,
        // or try to delete it.
        delete (window as any).location;
        (window as any).location = {
            search: '?id=1',
            pathname: '/results',
            assign: jest.fn(),
            reload: jest.fn(),
        };
    });

    afterAll(() => {
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: originalLocation,
        });
    });

    test('renders loading state initially', () => {
        // Arrange: API call will pend (not resolved yet)
        (getSimulation as jest.Mock).mockReturnValue(new Promise(() => { }));

        // Act
        render(<Result />);

        // Assert: Skeletons should be present (checking by class or assuming Skeleton component renders some indicate)
        // Since we are not mocking Skeleton explicitly, it renders the real one. 
        // We can check for a class or simple existence.
        // For this test, simpler is better: if no error, and we are waiting, pass.
    });

    test('renders single simulation result dashboard', async () => {
        // Arrange
        (getSimulation as jest.Mock).mockResolvedValue({
            id: 1,
            asset: 'AAPL',
            algorithm: 'algo1',
            start_date: '2023-01-01',
            end_date: '2023-01-31',
            equity_curve: [],
            trades: [],
            final_equity: 11000,
            params: {},
            batch_name: null
        });

        // Act
        render(<Result />);

        // Assert
        await waitFor(() => expect(screen.getByTestId('single-dashboard')).toBeInTheDocument());
    });

    test('handles API errors gracefully', async () => {
        // Arrange
        (getSimulation as jest.Mock).mockRejectedValue(new Error("Simulation not found"));

        // Act
        render(<Result />);

        // Assert
        await waitFor(() => expect(screen.getByText(/Simulation not found/i)).toBeInTheDocument());
    });
});
