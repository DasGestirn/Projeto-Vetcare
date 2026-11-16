import { createTheme } from '@mantine/core';

// Paleta e tipografia alinhadas ao protótipo de interface (vetcare-react).
const brand = [
  '#e9f5f2',
  '#d5ece7',
  '#aed9d0',
  '#85c6b7',
  '#5fb3a0',
  '#3a9d89',
  '#0f766e',
  '#0d655e',
  '#0f3d38',
  '#0a2a26',
];

export const theme = createTheme({
  fontFamily: "'DM Sans', sans-serif",
  headings: { fontFamily: "'DM Sans', sans-serif" },
  primaryColor: 'brand',
  primaryShade: 6,
  defaultRadius: 'md',
  colors: { brand },
  components: {
    Button: {
      defaultProps: { size: 'md' },
    },
    TextInput: {
      defaultProps: { size: 'md' },
    },
    PasswordInput: {
      defaultProps: { size: 'md' },
    },
    Select: {
      defaultProps: { size: 'md' },
    },
    Paper: {
      defaultProps: { radius: 12 },
    },
    Badge: {
      defaultProps: { radius: 'xl' },
    },
  },
});
