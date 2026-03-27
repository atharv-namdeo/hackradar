import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    })
  );
});

afterEach(() => {
  jest.resetAllMocks();
});

test('renders HackRadar title', async () => {
  render(<App />);

  expect(screen.getAllByText(/HackRadar/i)[0]).toBeInTheDocument();

  await screen.findByText(/no emails match your filters/i);
});

test('renders search input', async () => {
  render(<App />);

  expect(
    screen.getByPlaceholderText(/search hackathons, competitions/i)
  ).toBeInTheDocument();

  await screen.findByText(/no emails match your filters/i);
});

test('renders refresh button', async () => {
  render(<App />);

  expect(screen.getByText(/refresh/i)).toBeInTheDocument();

  await screen.findByText(/no emails match your filters/i);
});

test('shows loading state initially', async () => {
  let resolveFetch;

  global.fetch = jest.fn(
    () =>
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
  );

  render(<App />);

  expect(
    screen.getByText(/connecting to gmail api/i)
  ).toBeInTheDocument();

  resolveFetch({
    ok: true,
    json: () => Promise.resolve([]),
  });

  await screen.findByText(/no emails match your filters/i);
});
