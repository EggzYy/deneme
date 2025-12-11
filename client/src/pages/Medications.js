import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Medication, Add } from '@mui/icons-material';

const Medications = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Medications
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button variant="contained" startIcon={<Add />}>
          Add Medication
        </Button>
        <Button variant="outlined" startIcon={<Medication />}>
          View Reminders
        </Button>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Medications
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage your medications, track adherence, and set up reminders for taking your prescriptions.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Medications;
