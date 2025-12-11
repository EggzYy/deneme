import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Favorite,
  Medication,
  Assessment,
  Videocam,
  TrendingUp,
  Schedule,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();

  // Sample data for health trends
  const healthData = [
    { date: '2024-01-01', heartRate: 72, weight: 70 },
    { date: '2024-01-08', heartRate: 75, weight: 69.5 },
    { date: '2024-01-15', heartRate: 73, weight: 69.2 },
    { date: '2024-01-22', heartRate: 78, weight: 69.0 },
    { date: '2024-01-29', heartRate: 76, weight: 68.8 },
  ];

  const quickStats = [
    { title: 'Heart Rate', value: '76 bpm', icon: <Favorite />, color: '#d32f2f' },
    { title: 'Weight', value: '68.8 kg', icon: <TrendingUp />, color: '#1976d2' },
    { title: 'Medications', value: '3 Active', icon: <Medication />, color: '#388e3c' },
    { title: 'Health Score', value: '85%', icon: <Assessment />, color: '#f57c00' },
  ];

  const upcomingAppointments = [
    { doctor: 'Dr. Sarah Johnson', specialty: 'Cardiology', time: 'Tomorrow, 2:00 PM', type: 'video' },
    { doctor: 'Dr. Michael Chen', specialty: 'General Practice', time: 'Friday, 10:30 AM', type: 'in-person' },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.firstName}!
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Here's your health overview for today.
      </Typography>

      <Grid container spacing={3}>
        {/* Quick Stats */}
        {quickStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card className="health-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: stat.color, mr: 2 }}>
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="div">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Health Trends Chart */}
        <Grid item xs={12} md={8}>
          <Card className="health-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Health Trends (Last 30 Days)
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={healthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="heartRate"
                      stroke="#d32f2f"
                      strokeWidth={2}
                      name="Heart Rate (bpm)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="weight"
                      stroke="#1976d2"
                      strokeWidth={2}
                      name="Weight (kg)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card className="health-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Videocam />}
                  href="/consultations/new"
                  fullWidth
                >
                  Book Consultation
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Medication />}
                  href="/medications"
                  fullWidth
                >
                  Manage Medications
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Assessment />}
                  href="/analytics"
                  fullWidth
                >
                  View Analytics
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Appointments */}
        <Grid item xs={12} md={6}>
          <Card className="health-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Appointments
              </Typography>
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {appointment.doctor}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {appointment.specialty}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Schedule sx={{ fontSize: 16, mr: 1 }} />
                      <Typography variant="body2">{appointment.time}</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                      {appointment.type} consultation
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No upcoming appointments
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Health Goals Progress */}
        <Grid item xs={12} md={6}>
          <Card className="health-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Health Goals Progress
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Daily Steps</Typography>
                  <Typography variant="body2">7,250 / 10,000</Typography>
                </Box>
                <LinearProgress variant="determinate" value={72.5} />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Sleep Hours</Typography>
                  <Typography variant="body2">6.5 / 8 hours</Typography>
                </Box>
                <LinearProgress variant="determinate" value={81.25} color="success" />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Medication Adherence</Typography>
                  <Typography variant="body2">95%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={95} color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
