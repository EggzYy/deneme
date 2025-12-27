import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { healthService } from '../services/healthService';
import { analyticsService } from '../services/analyticsService';

const HealthData = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState([]);
  const [insights, setInsights] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    dataType: 'vital-signs',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    notes: ''
  });

  const dataTypeFields = {
    'vital-signs': {
      title: 'Vital Signs',
      fields: [
        { name: 'bloodPressureSystolic', label: 'Blood Pressure (Systolic)', type: 'number', unit: 'mmHg' },
        { name: 'bloodPressureDiastolic', label: 'Blood Pressure (Diastolic)', type: 'number', unit: 'mmHg' },
        { name: 'heartRate', label: 'Heart Rate', type: 'number', unit: 'bpm' },
        { name: 'temperature', label: 'Temperature', type: 'number', unit: '°F' },
        { name: 'respiratoryRate', label: 'Respiratory Rate', type: 'number', unit: 'breaths/min' },
        { name: 'oxygenSaturation', label: 'Oxygen Saturation', type: 'number', unit: '%' }
      ]
    },
    'body-measurements': {
      title: 'Body Measurements',
      fields: [
        { name: 'weight', label: 'Weight', type: 'number', unit: 'lbs' },
        { name: 'height', label: 'Height', type: 'number', unit: 'inches' },
        { name: 'bmi', label: 'BMI', type: 'number', unit: '' },
        { name: 'bodyFat', label: 'Body Fat %', type: 'number', unit: '%' },
        { name: 'waistCircumference', label: 'Waist Circumference', type: 'number', unit: 'inches' },
        { name: 'hipCircumference', label: 'Hip Circumference', type: 'number', unit: 'inches' }
      ]
    },
    'activity': {
      title: 'Activity & Exercise',
      fields: [
        { name: 'steps', label: 'Steps', type: 'number', unit: 'steps' },
        { name: 'distance', label: 'Distance', type: 'number', unit: 'miles' },
        { name: 'calories', label: 'Calories Burned', type: 'number', unit: 'kcal' },
        { name: 'activeMinutes', label: 'Active Minutes', type: 'number', unit: 'minutes' },
        { name: 'exerciseType', label: 'Exercise Type', type: 'text', unit: '' },
        { name: 'exerciseDuration', label: 'Exercise Duration', type: 'number', unit: 'minutes' }
      ]
    },
    'sleep': {
      title: 'Sleep',
      fields: [
        { name: 'duration', label: 'Sleep Duration', type: 'number', unit: 'hours' },
        { name: 'quality', label: 'Sleep Quality', type: 'range', unit: '/10' },
        { name: 'sleepScore', label: 'Sleep Score', type: 'number', unit: '/100' },
        { name: 'deepSleep', label: 'Deep Sleep', type: 'number', unit: 'hours' },
        { name: 'lightSleep', label: 'Light Sleep', type: 'number', unit: 'hours' },
        { name: 'awakenings', label: 'Awakenings', type: 'number', unit: 'times' }
      ]
    },
    'mental-health': {
      title: 'Mental Health & Mood',
      fields: [
        { name: 'mood', label: 'Mood', type: 'range', unit: '/10' },
        { name: 'stress', label: 'Stress Level', type: 'range', unit: '/10' },
        { name: 'anxiety', label: 'Anxiety Level', type: 'range', unit: '/10' },
        { name: 'energy', label: 'Energy Level', type: 'range', unit: '/10' },
        { name: 'sleepQuality', label: 'Sleep Quality', type: 'range', unit: '/10' },
        { name: 'overallWellbeing', label: 'Overall Wellbeing', type: 'range', unit: '/10' }
      ]
    },
    'nutrition': {
      title: 'Nutrition',
      fields: [
        { name: 'calories', label: 'Calories', type: 'number', unit: 'kcal' },
        { name: 'water', label: 'Water Intake', type: 'number', unit: 'oz' },
        { name: 'protein', label: 'Protein', type: 'number', unit: 'g' },
        { name: 'carbs', label: 'Carbohydrates', type: 'number', unit: 'g' },
        { name: 'fat', label: 'Fat', type: 'number', unit: 'g' },
        { name: 'fiber', label: 'Fiber', type: 'number', unit: 'g' }
      ]
    },
    'blood-glucose': {
      title: 'Blood Glucose',
      fields: [
        { name: 'glucoseLevel', label: 'Glucose Level', type: 'number', unit: 'mg/dL' },
        { name: 'measurementType', label: 'Measurement Type', type: 'select', unit: '', options: ['Fasting', 'Before Meal', 'After Meal', 'Bedtime'] },
        { name: 'carbIntake', label: 'Carb Intake', type: 'number', unit: 'g' }
      ]
    },
    'pain': {
      title: 'Pain',
      fields: [
        { name: 'painLevel', label: 'Pain Level', type: 'range', unit: '/10' },
        { name: 'painLocation', label: 'Pain Location', type: 'text', unit: '' },
        { name: 'painType', label: 'Pain Type', type: 'text', unit: '' }
      ]
    }
  };

  useEffect(() => {
    fetchHealthData();
    fetchInsights();
  }, []);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await healthService.getHealthData();
      setHealthData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching health data:', error);
      toast.error('Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await analyticsService.getHealthInsights();
      setInsights(response.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (dataType = 'vital-signs', id = null) => {
    if (id) {
      const entry = healthData.find(item => item._id === id);
      if (entry) {
        setFormData({
          ...entry.data,
          dataType: entry.dataType,
          date: new Date(entry.date).toISOString().split('T')[0],
          time: new Date(entry.date).toTimeString().slice(0, 5),
          notes: entry.notes || ''
        });
        setEditingId(id);
      }
    } else {
      setFormData({
        dataType: dataType,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        notes: ''
      });
      setEditingId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setFormData({
      dataType: 'vital-signs',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      notes: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDataTypeChange = (e) => {
    const newDataType = e.target.value;
    setFormData(prev => ({
      ...prev,
      dataType: newDataType
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      const dataToSubmit = {
        dataType: formData.dataType,
        date: dateTime,
        data: { ...formData },
        notes: formData.notes
      };
      delete dataToSubmit.date;
      delete dataToSubmit.time;
      delete dataToSubmit.dataType;
      delete dataToSubmit.notes;

      if (editingId) {
        await healthService.updateHealthData(editingId, dataToSubmit);
        toast.success('Health data updated successfully');
      } else {
        await healthService.addHealthData(dataToSubmit);
        toast.success('Health data added successfully');
      }

      handleCloseDialog();
      fetchHealthData();
      fetchInsights();
    } catch (error) {
      console.error('Error saving health data:', error);
      toast.error('Failed to save health data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this health data entry?')) {
      try {
        setLoading(true);
        await healthService.deleteHealthData(id);
        toast.success('Health data deleted successfully');
        fetchHealthData();
      } catch (error) {
        console.error('Error deleting health data:', error);
        toast.error('Failed to delete health data');
      } finally {
        setLoading(false);
      }
    }
  };

  const getChartData = (dataType, metric) => {
    return healthData
      .filter(item => item.dataType === dataType && item.data[metric])
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(item => ({
        date: new Date(item.date).toLocaleDateString(),
        value: parseFloat(item.data[metric]),
        ...item.data
      }));
  };

  const getDataTypeStats = (dataType) => {
    const filteredData = healthData.filter(item => item.dataType === dataType);
    return {
      count: filteredData.length,
      latest: filteredData[filteredData.length - 1]
    };
  };

  const renderDataEntryForm = () => {
    const currentDataType = dataTypeFields[formData.dataType];
    if (!currentDataType) return null;

    return (
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Data Type</InputLabel>
              <Select value={formData.dataType} onChange={handleDataTypeChange}>
                {Object.entries(dataTypeFields).map(([key, config]) => (
                  <MenuItem key={key} value={key}>{config.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              margin="normal"
              required
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Time"
              type="time"
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              margin="normal"
              required
            />
          </Grid>
          {currentDataType.fields.map(field => (
            <Grid item xs={12} md={6} key={field.name}>
              {field.type === 'select' ? (
                <FormControl fullWidth margin="normal">
                  <InputLabel>{field.label}</InputLabel>
                  <Select
                    value={formData[field.name] || ''}
                    name={field.name}
                    onChange={handleInputChange}
                  >
                    {field.options.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : field.type === 'range' ? (
                <>
                  <Typography gutterBottom>{field.label} {field.unit}</Typography>
                  <input
                    type="range"
                    name={field.name}
                    value={formData[field.name] || 5}
                    onChange={handleInputChange}
                    min="0"
                    max="10"
                    style={{ width: '100%' }}
                  />
                  <Typography variant="body2" align="center">
                    {formData[field.name] || 5}
                  </Typography>
                </>
              ) : (
                <TextField
                  fullWidth
                  label={`${field.label} ${field.unit ? `(${field.unit})` : ''}`}
                  type={field.type}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleInputChange}
                  margin="normal"
                />
              )}
            </Grid>
          ))}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </form>
    );
  };

  const renderHealthDataList = () => {
    if (healthData.length === 0) {
      return (
        <Alert severity="info">
          No health data recorded yet. Add your first entry to start tracking!
        </Alert>
      );
    }

    return (
      <Box>
        {Object.entries(dataTypeFields).map(([key, config]) => {
          const stats = getDataTypeStats(key);
          if (stats.count === 0) return null;

          return (
            <Card key={key} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">{config.title}</Typography>
                  <Box>
                    <Button
                      startIcon={<Add />}
                      onClick={() => handleOpenDialog(key)}
                      sx={{ mr: 1 }}
                    >
                      Add
                    </Button>
                    <Button onClick={() => setTabValue(2)}>
                      View Charts
                    </Button>
                  </Box>
                </Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {stats.count} entries recorded
                </Typography>
                {stats.latest && (
                  <Box mt={2}>
                    <Typography variant="body2">
                      Latest Entry: {new Date(stats.latest.date).toLocaleString()}
                    </Typography>
                    <Grid container spacing={1} mt={1}>
                      {Object.entries(stats.latest.data).slice(0, 4).map(([field, value]) => {
                        if (typeof value === 'object' || !value) return null;
                        const fieldConfig = config.fields.find(f => f.name === field);
                        return fieldConfig ? (
                          <Grid item xs={6} md={3} key={field}>
                            <Typography variant="body2">
                              <strong>{fieldConfig.label}:</strong> {value} {fieldConfig.unit}
                            </Typography>
                          </Grid>
                        ) : null;
                      })}
                    </Grid>
                    <Box mt={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(key, stats.latest._id)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(stats.latest._id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>
    );
  };

  const renderCharts = () => {
    const chartTypes = [
      { dataType: 'vital-signs', metrics: ['bloodPressureSystolic', 'bloodPressureDiastolic', 'heartRate', 'temperature'], title: 'Vital Signs' },
      { dataType: 'body-measurements', metrics: ['weight', 'bmi'], title: 'Body Measurements' },
      { dataType: 'activity', metrics: ['steps', 'calories', 'activeMinutes'], title: 'Activity' },
      { dataType: 'sleep', metrics: ['duration', 'quality'], title: 'Sleep' },
      { dataType: 'mental-health', metrics: ['mood', 'stress', 'anxiety', 'energy'], title: 'Mental Health' }
    ];

    return (
      <Grid container spacing={3}>
        {chartTypes.map(chartType => {
          const hasData = chartType.metrics.some(metric => 
            healthData.filter(item => item.dataType === chartType.dataType && item.data[metric]).length > 0
          );
          
          if (!hasData) return null;

          return (
            <Grid item xs={12} md={6} key={chartType.dataType}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{chartType.title}</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {chartType.metrics.filter(metric => 
                        healthData.filter(item => item.dataType === chartType.dataType && item.data[metric]).length > 0
                      ).map((metric, index) => {
                        const data = getChartData(chartType.dataType, metric);
                        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];
                        return (
                          <Line
                            key={metric}
                            type="monotone"
                            data={data}
                            dataKey="value"
                            name={metric.replace(/([A-Z])/g, ' $1').trim()}
                            stroke={colors[index]}
                            strokeWidth={2}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderInsights = () => {
    if (!insights) {
      return (
        <Alert severity="info">
          No insights available yet. Add more health data to receive personalized insights!
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Health Score</Typography>
              {insights.healthScore !== undefined ? (
                <Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Box sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: insights.healthScore >= 80 ? '#4caf50' : insights.healthScore >= 60 ? '#ff9800' : '#f44336',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.2rem'
                    }}>
                      {insights.healthScore}
                    </Box>
                    <Box ml={2}>
                      <Typography variant="h6">
                        {insights.healthScore >= 80 ? 'Excellent' : insights.healthScore >= 60 ? 'Good' : 'Needs Attention'}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Based on your recent health data
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2">Not enough data for health score</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {insights.recommendations && insights.recommendations.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Recommendations</Typography>
                <Box>
                  {insights.recommendations.map((rec, index) => (
                    <Alert severity="info" sx={{ mb: 1 }} key={index}>
                      {rec}
                    </Alert>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {insights.trends && insights.trends.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Health Trends</Typography>
                <Grid container spacing={2}>
                  {insights.trends.map((trend, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Alert severity={trend.type === 'positive' ? 'success' : trend.type === 'negative' ? 'warning' : 'info'}>
                        <Typography variant="subtitle2">{trend.metric}</Typography>
                        <Typography variant="body2">{trend.insight}</Typography>
                      </Alert>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Health Data Tracking</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Health Data
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="My Health Data" />
        <Tab label="Data Entry" />
        <Tab label="Charts & Trends" />
        <Tab label="Insights" />
      </Tabs>

      <Box sx={{ mt: 3 }}>
        {tabValue === 0 && renderHealthDataList()}
        {tabValue === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {formData.dataType ? dataTypeFields[formData.dataType].title : 'Add New Health Data'}
              </Typography>
              {renderDataEntryForm()}
              <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
                <Button onClick={() => setTabValue(0)}>Cancel</Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {editingId ? 'Update' : 'Save'} Health Data
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
        {tabValue === 2 && renderCharts()}
        {tabValue === 3 && renderInsights()}
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit' : 'Add'} Health Data
        </DialogTitle>
        <DialogContent>
          {renderDataEntryForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {editingId ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HealthData;