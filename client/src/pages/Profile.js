import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Personal Information
          </Typography>
          <Typography variant="body1">
            Name: {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant="body1">
            Email: {user?.email}
          </Typography>
          <Typography variant="body1">
            Role: {user?.role}
          </Typography>
          
          <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
            Health Profile
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Complete your health profile to get personalized recommendations.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;
