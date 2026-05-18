import React from 'react';
import { Box, Button, Stack } from '@mui/material';

const FilterTabs = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { label: 'All', value: 'all' },
    { label: 'Placement', value: 'Placement' },
    { label: 'Result', value: 'Result' },
    { label: 'Event', value: 'Event' },
    { label: 'Unread Only', value: 'unread' },
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant={activeFilter === filter.value ? 'contained' : 'outlined'}
            onClick={() => onFilterChange(filter.value)}
            sx={{
              mb: 1,
              textTransform: 'none',
              fontSize: '0.95rem',
            }}
          >
            {filter.label}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};

export default FilterTabs;
