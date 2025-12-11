import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { TrackChanges } from '@mui/icons-material';

const SymptomChecker = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Symptom Checker
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            AI-Powered Symptom Analysis
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Describe your symptoms and get AI-powered insights and recommendations.
            This tool helps you understand potential causes and urgency levels.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SymptomChecker;
