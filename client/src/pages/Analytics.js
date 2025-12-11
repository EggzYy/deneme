import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Assessment } from '@mui/icons-material';

const Analytics = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Health Analytics
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Health Insights
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View comprehensive analytics and insights about your health trends, patterns, and recommendations.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Analytics;
