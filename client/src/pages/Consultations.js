import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { VideoCall, PersonAdd } from '@mui/icons-material';

const Consultations = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Consultations
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button variant="contained" startIcon={<VideoCall />}>
          Book Video Consultation
        </Button>
        <Button variant="outlined" startIcon={<PersonAdd />}>
          Find Doctors
        </Button>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Consultations
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View and manage your upcoming and past consultations with healthcare providers.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Consultations;
