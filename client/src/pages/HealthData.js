import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const HealthData = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Health Data
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Track Your Health Metrics
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Monitor your vital signs, activity levels, and other health indicators.
            This section will display charts and trends for your health data.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default HealthData;
