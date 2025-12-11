import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
} from '@mui/material';
import {
  Dashboard,
  Person,
  Favorite,
  VideoCall,
  Medication,
  Assessment,
  SymptomTracker,
  LocalHospital,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['patient', 'doctor'] },
    { text: 'Profile', icon: <Person />, path: '/profile', roles: ['patient', 'doctor'] },
    { text: 'Health Data', icon: <Favorite />, path: '/health-data', roles: ['patient'] },
    { text: 'Consultations', icon: <VideoCall />, path: '/consultations', roles: ['patient', 'doctor'] },
    { text: 'Medications', icon: <Medication />, path: '/medications', roles: ['patient'] },
    { text: 'Analytics', icon: <Assessment />, path: '/analytics', roles: ['patient'] },
    { text: 'Symptom Checker', icon: <SymptomTracker />, path: '/symptom-checker', roles: ['patient'] },
  ];

  const doctorItems = [
    { text: 'Find Doctors', icon: <LocalHospital />, path: '/doctors', roles: ['patient'] },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          mt: 8,
        },
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            HealthLink
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {user?.role === 'patient' ? 'Patient Portal' : 'Provider Portal'}
          </Typography>
        </Box>
        
        <Divider />
        
        <List>
          {menuItems
            .filter(item => item.roles.includes(user?.role))
            .map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? 'primary.main' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontWeight: isActive(item.path) ? 600 : 400,
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        {user?.role === 'patient' && (
          <>
            <Divider />
            <List>
              {doctorItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    selected={isActive(item.path)}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
