import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'lg',
        fontWeight: 'medium',
        transition: 'all 0.2s',
      },
      defaultProps: {
        variant: 'solid',
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderRadius: 'lg',
            borderColor: 'gray.200',
            _hover: { borderColor: 'gray.300' },
            _focus: {
              borderColor: 'blue.400',
              boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
            },
          },
        },
      },
      defaultProps: {
        variant: 'outline',
        size: 'md',
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: 'xl',
          boxShadow: 'xl',
        },
        header: {
          fontWeight: '600',
          fontSize: 'lg',
        },
        body: {
          py: 6,
        },
        footer: {
          pt: 4,
          borderTopWidth: '1px',
          borderColor: 'gray.100',
        },
      },
    },
    Table: {
      variants: {
        simple: {
          th: {
            borderColor: 'gray.200',
            fontWeight: '600',
            color: 'gray.600',
            textTransform: 'none',
            fontSize: 'sm',
          },
          td: {
            borderColor: 'gray.100',
          },
        },
        striped: {
          th: {
            borderColor: 'gray.200',
            fontWeight: '600',
            color: 'gray.600',
            textTransform: 'none',
            fontSize: 'sm',
          },
          td: {
            borderColor: 'gray.100',
          },
        },
      },
    },
    AlertDialog: {
      baseStyle: {
        dialog: {
          borderRadius: 'xl',
          boxShadow: 'xl',
        },
      },
    },
  },
});

export default theme;
