import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Simulator from '../../pages/Simulator';
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

// Mock the hook to avoid complex logic
jest.mock('../../components/features/simulator/useSimulator', () => ({
    useSimulator: () => ({
        assetName: 'AAPL',
        setAssetName: jest.fn(),
        algorithm: 'algo1',
        setAlgorithm: jest.fn(),
        startDate: new Date(),
        setStartDate: jest.fn(),
        endDate: new Date(),
        setEndDate: jest.fn(),
        initialInvestment: 10000,
        setInitialInvestment: jest.fn(),
        isRunning: false,
        assetType: 'stock',
        setAssetType: jest.fn(),
        batchMode: false,
        setBatchMode: jest.fn(),
        // Add other missing props as needed by the component
        canRunSimulation: true,
        handleRunSimulation: jest.fn(),
    }),
}));

// Mock child components to avoid deep rendering issues
jest.mock('../../components/features/simulator/AssetSelector', () => () => <div data-testid="asset-selector">AssetSelector</div>);
jest.mock('../../components/features/simulator/AlgorithmSelector', () => () => <div data-testid="algo-selector">AlgorithmSelector</div>);
jest.mock('../../components/features/simulator/ConfigPanel', () => () => <div data-testid="config-panel">ConfigPanel</div>);
jest.mock('../../components/features/simulator/PriceChart', () => () => <div data-testid="price-chart">PriceChart</div>);
jest.mock('../../components/features/simulator/BatchModeToggle', () => () => <div data-testid="batch-toggle">BatchModeToggle</div>);
jest.mock('../../components/features/simulator/BatchConfiguration', () => ({ children }: { children: React.ReactNode }) => <div data-testid="batch-config">{children}</div>);

test('renders Simulator page with components', () => {
    render(
        <MemoryRouter>
            <Simulator />
        </MemoryRouter>
    );

    expect(screen.getByText('New Simulation')).toBeInTheDocument();
    expect(screen.getByTestId('asset-selector')).toBeInTheDocument();
    expect(screen.getByTestId('algo-selector')).toBeInTheDocument();
    expect(screen.getByTestId('config-panel')).toBeInTheDocument();
    expect(screen.getByText(/Run.*Simulation/i)).toBeInTheDocument();
});
