import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const DoctorProfile = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Doctor Profile
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Healthcare Provider Information
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View detailed information about doctors, their specializations, availability, and patient reviews.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DoctorProfile;
