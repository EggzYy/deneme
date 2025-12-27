import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Autocomplete,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  Avatar
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
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Add,
  Edit,
  Delete,
  Search,
  Alarm,
  CheckCircle,
  Cancel,
  Warning,
  Visibility,
  Save,
  History,
  TrendingUp,
  Healing
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { medicationService } from '../services/medicationService';

const Medications = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [adherenceData, setAdherenceData] = useState({});
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openReminderDialog, setOpenReminderDialog] = useState(false);
  const [currentMedicationId, setCurrentMedicationId] = useState(null);
  const [formData, setFormData] = useState({
    dosage: '',
    frequency: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    instructions: '',
    prescribedBy: '',
    pharmacy: '',
    refills: 0
  });
  const [reminderData, setReminderData] = useState({
    enabled: true,
    times: ['08:00', '20:00'],
    method: 'push'
  });

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const response = await medicationService.getMyMedications();
      setMedications(Array.isArray(response.data) ? response.data : []);
      
      // Fetch adherence data for each medication
      const adherencePromises = response.data.map(async (med) => {
        try {
          const adherence = await medicationService.getAdherence(med._id);
          return { [med._id]: adherence.data };
        } catch (error) {
          console.error(`Error fetching adherence for ${med._id}:`, error);
          return { [med._id]: null };
        }
      });
      
      const adherenceResults = await Promise.all(adherencePromises);
      const adherenceMap = adherenceResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setAdherenceData(adherenceMap);
    } catch (error) {
      console.error('Error fetching medications:', error);
      toast.error('Failed to fetch medications');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchMedications = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const response = await medicationService.searchMedications(searchQuery);
      setSearchResults(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error searching medications:', error);
      toast.error('Failed to search medications');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMedication = (medication) => {
    setSelectedMedication(medication);
    setOpenAddDialog(true);
  };

  const handleOpenReminderDialog = (medicationId) => {
    setCurrentMedicationId(medicationId);
    const medication = medications.find(m => m._id === medicationId);
    if (medication && medication.reminders) {
      setReminderData(medication.reminders);
    }
    setOpenReminderDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setSelectedMedication(null);
    setFormData({
      dosage: '',
      frequency: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      instructions: '',
      prescribedBy: '',
      pharmacy: '',
      refills: 0
    });
  };

  const handleCloseReminderDialog = () => {
    setOpenReminderDialog(false);
    setCurrentMedicationId(null);
    setReminderData({
      enabled: true,
      times: ['08:00', '20:00'],
      method: 'push'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReminderChange = (e) => {
    const { name, value, checked, type } = e.target;
    setReminderData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddTimeSlot = () => {
    setReminderData(prev => ({
      ...prev,
      times: [...prev.times, '12:00']
    }));
  };

  const handleRemoveTimeSlot = (index) => {
    setReminderData(prev => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index)
    }));
  };

  const handleTimeChange = (index, value) => {
    setReminderData(prev => ({
      ...prev,
      times: prev.times.map((time, i) => i === index ? value : time)
    }));
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    if (!selectedMedication) return;

    try {
      setLoading(true);
      const medicationData = {
        medication: selectedMedication._id,
        name: selectedMedication.name,
        genericName: selectedMedication.genericName,
        dosage: formData.dosage,
        frequency: formData.frequency,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        instructions: formData.instructions,
        prescribedBy: formData.prescribedBy,
        pharmacy: formData.pharmacy,
        refills: parseInt(formData.refills) || 0,
        status: 'active'
      };

      await medicationService.addMedication(medicationData);
      toast.success('Medication added successfully');
      handleCloseAddDialog();
      fetchMedications();
    } catch (error) {
      console.error('Error adding medication:', error);
      toast.error('Failed to add medication');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMedication = async (e) => {
    e.preventDefault();
    if (!selectedMedication || !editingId) return;

    try {
      setLoading(true);
      const medicationData = {
        dosage: formData.dosage,
        frequency: formData.frequency,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        instructions: formData.instructions,
        prescribedBy: formData.prescribedBy,
        pharmacy: formData.pharmacy,
        refills: parseInt(formData.refills) || 0,
      };

      await medicationService.updateMedication(editingId, medicationData);
      toast.success('Medication updated successfully');
      handleCloseAddDialog();
      fetchMedications();
    } catch (error) {
      console.error('Error updating medication:', error);
      toast.error('Failed to update medication');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReminders = async () => {
    try {
      setLoading(true);
      await medicationService.setReminders(currentMedicationId, reminderData);
      toast.success('Reminders saved successfully');
      handleCloseReminderDialog();
      fetchMedications();
    } catch (error) {
      console.error('Error saving reminders:', error);
      toast.error('Failed to save reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordIntake = async (medicationId, taken) => {
    try {
      setLoading(true);
      const intakeData = {
        timestamp: new Date(),
        taken,
        notes: taken ? 'Taken as prescribed' : 'Missed dose'
      };
      await medicationService.recordIntake(medicationId, intakeData);
      toast.success(taken ? 'Dose recorded' : 'Missed dose recorded');
      fetchMedications();
    } catch (error) {
      console.error('Error recording intake:', error);
      toast.error('Failed to record intake');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedication = async (medicationId) => {
    if (window.confirm('Are you sure you want to remove this medication? This will not affect your historical data.')) {
      try {
        setLoading(true);
        await medicationService.deleteMedication(medicationId);
        toast.success('Medication removed successfully');
        fetchMedications();
      } catch (error) {
        console.error('Error deleting medication:', error);
        toast.error('Failed to delete medication');
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'completed': return 'default';
      case 'discontinued': return 'error';
      default: return 'default';
    }
  };

  const getAdherenceChartData = (medicationId) => {
    const data = adherenceData[medicationId];
    if (!data || !data.weekly) return [];
    
    return Object.entries(data.weekly).map(([date, values]) => ({
      date: new Date(date).toLocaleDateString(),
      taken: values.taken,
      missed: values.missed,
      adherence: values.adherenceRate
    }));
  };

  const renderMedicationsList = () => {
    if (medications.length === 0) {
      return (
        <Alert severity="info">
          No medications recorded yet. Add your first medication to start tracking!
        </Alert>
      );
    }

    return (
      <Grid container spacing={2}>
        {medications.map((medication) => {
          const adherence = adherenceData[medication._id];
          return (
            <Grid item xs={12} md={6} key={medication._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6">
                        {medication.name}
                        {medication.genericName && (
                          <Typography variant="body2" color="textSecondary">
                            ({medication.genericName})
                          </Typography>
                        )}
                      </Typography>
                      <Chip 
                        label={medication.status} 
                        color={getStatusColor(medication.status)}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenReminderDialog(medication._id)}
                        color="primary"
                      >
                        <Alarm />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingId(medication._id);
                          setSelectedMedication(medication);
                          setFormData({
                            dosage: medication.dosage,
                            frequency: medication.frequency,
                            startDate: medication.startDate.split('T')[0],
                            endDate: medication.endDate?.split('T')[0] || '',
                            instructions: medication.instructions || '',
                            prescribedBy: medication.prescribedBy || '',
                            pharmacy: medication.pharmacy || '',
                            refills: medication.refills || 0
                          });
                          setOpenAddDialog(true);
                        }}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteMedication(medication._id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Dosage</Typography>
                      <Typography variant="body1">{medication.dosage}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Frequency</Typography>
                      <Typography variant="body1">{medication.frequency}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Start Date</Typography>
                      <Typography variant="body1">
                        {new Date(medication.startDate).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Status</Typography>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {medication.status}
                      </Typography>
                    </Grid>
                    {medication.prescribedBy && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Prescribed By</Typography>
                        <Typography variant="body1">{medication.prescribedBy}</Typography>
                      </Grid>
                    )}
                    {medication.instructions && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Instructions</Typography>
                        <Typography variant="body1">{medication.instructions}</Typography>
                      </Grid>
                    )}
                  </Grid>

                  {adherence && adherence.overall && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Adherence: {adherence.overall.overallRate.toFixed(1)}%
                      </Typography>
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleRecordIntake(medication._id, true)}
                          color="success"
                          title="Mark as taken"
                        >
                          <CheckCircle />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleRecordIntake(medication._id, false)}
                          color="error"
                          title="Mark as missed"
                        >
                          <Cancel />
                        </IconButton>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderSearchInterface = () => {
    return (
      <Box>
        <Box component="form" onSubmit={handleSearchMedications} mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={9}>
              <TextField
                fullWidth
                label="Search Medications"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter medication name, condition, or generic name..."
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                type="submit"
                startIcon={<Search />}
                disabled={loading}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </Box>

        {searchResults.length > 0 ? (
          <Grid container spacing={2}>
            {searchResults.map((medication) => (
              <Grid item xs={12} md={6} key={medication._id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="h6">{medication.name}</Typography>
                        {medication.genericName && (
                          <Typography variant="body2" color="textSecondary">
                            Generic: {medication.genericName}
                          </Typography>
                        )}
                        <Typography variant="body2" color="textSecondary">
                          Category: {medication.category}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleSelectMedication(medication)}
                      >
                        Add
                      </Button>
                    </Box>

                    {medication.description && (
                      <Box mt={2}>
                        <Typography variant="body2" color="textSecondary">
                          {medication.description}
                        </Typography>
                      </Box>
                    )}

                    {medication.sideEffects && medication.sideEffects.length > 0 && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>
                          Common Side Effects:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {medication.sideEffects.slice(0, 3).map((effect, index) => (
                            <Chip
                              key={index}
                              label={effect}
                              size="small"
                              variant="outlined"
                              color="warning"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {medication.contraindications && medication.contraindications.length > 0 && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">Contraindications:</Typography>
                        {medication.contraindications.slice(0, 2).map((contra, index) => (
                          <Typography key={index} variant="body2">• {contra}</Typography>
                        ))}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            Enter a search term to find medications you want to add to your list.
          </Alert>
        )}
      </Box>
    );
  };

  const renderAdherenceDashboard = () => {
    const medicationWithAdherence = medications.filter(med => adherenceData[med._id]);
    
    if (medicationWithAdherence.length === 0) {
      return (
        <Alert severity="info">
          No adherence data available yet. Start tracking your medication intake to see adherence patterns.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {medicationWithAdherence.map((medication) => {
          const adherence = adherenceData[medication._id];
          const chartData = getAdherenceChartData(medication._id);

          return (
            <Grid item xs={12} key={medication._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {medication.name}
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" align="center" color="primary">
                            {adherence.overall.overallRate.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" align="center" color="textSecondary">
                            Overall Adherence
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" align="center" color="success.main">
                            {adherence.overall.taken}
                          </Typography>
                          <Typography variant="body2" align="center" color="textSecondary">
                            Doses Taken
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" align="center" color="error.main">
                            {adherence.overall.missed}
                          </Typography>
                          <Typography variant="body2" align="center" color="textSecondary">
                            Doses Missed
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" align="center">
                            {adherence.overall.streak}
                          </Typography>
                          <Typography variant="body2" align="center" color="textSecondary">
                            Current Streak
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {chartData.length > 0 && (
                    <Box mt={3}>
                      <Typography variant="subtitle2" gutterBottom>
                        Weekly Adherence Trend
                      </Typography>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="taken" fill="#4caf50" name="Taken" />
                          <Bar dataKey="missed" fill="#f44336" name="Missed" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}

                  {adherence.aiInsights && adherence.aiInsights.length > 0 && (
                    <Box mt={3}>
                      <Typography variant="subtitle2" gutterBottom>
                        AI Insights
                      </Typography>
                      {adherence.aiInsights.map((insight, index) => (
                        <Alert severity="info" sx={{ mb: 1 }} key={index}>
                          {insight}
                        </Alert>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderAddMedicationForm = () => {
    return (
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit' : 'Add'} Medication: {selectedMedication?.name}
        </DialogTitle>
        <DialogContent>
          <form onSubmit={editingId ? handleUpdateMedication : handleAddMedication}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Dosage"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  helperText="e.g., 10mg, 2 tablets"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  helperText="e.g., Once daily, Twice daily"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="End Date (Optional)"
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Prescribed By"
                  name="prescribedBy"
                  value={formData.prescribedBy}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Pharmacy"
                  name="pharmacy"
                  value={formData.pharmacy}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Refills Remaining"
                  type="number"
                  name="refills"
                  value={formData.refills}
                  onChange={handleInputChange}
                  margin="normal"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Special Instructions"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  margin="normal"
                  multiline
                  rows={3}
                  helperText="e.g., Take with food, Avoid alcohol"
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            onClick={editingId ? handleUpdateMedication : handleAddMedication}
            disabled={loading}
          >
            {editingId ? 'Update' : 'Add'} Medication
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderReminderDialog = () => {
    return (
      <Dialog open={openReminderDialog} onClose={handleCloseReminderDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Medication Reminders
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={reminderData.enabled}
                    onChange={handleReminderChange}
                    name="enabled"
                  />
                }
                label="Enable Reminders"
              />
            </Grid>
            
            {reminderData.enabled && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Reminder Times
                  </Typography>
                  {reminderData.times.map((time, index) => (
                    <Box key={index} display="flex" alignItems="center" mb={1}>
                      <TextField
                        type="time"
                        value={time}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                        disabled={!reminderData.enabled}
                        sx={{ mr: 1 }}
                      />
                      <IconButton
                        onClick={() => handleRemoveTimeSlot(index)}
                        disabled={reminderData.times.length <= 1 || !reminderData.enabled}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    startIcon={<Add />}
                    onClick={handleAddTimeSlot}
                    disabled={!reminderData.enabled}
                    size="small"
                  >
                    Add Time Slot
                  </Button>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Notification Method</InputLabel>
                    <Select
                      value={reminderData.method}
                      name="method"
                      onChange={handleReminderChange}
                      disabled={!reminderData.enabled}
                    >
                      <MenuItem value="push">Push Notification</MenuItem>
                      <MenuItem value="email">Email</MenuItem>
                      <MenuItem value="sms">SMS</MenuItem>
                      <MenuItem value="all">All Methods</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReminderDialog}>Cancel</Button>
          <Button
            onClick={handleSaveReminders}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            Save Reminders
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const [editingId, setEditingId] = useState(null);

  const handleOpenEditDialog = (medication) => {
    setEditingId(medication._id);
    setSelectedMedication(medication);
    setFormData({
      dosage: medication.dosage,
      frequency: medication.frequency,
      startDate: medication.startDate.split('T')[0],
      endDate: medication.endDate?.split('T')[0] || '',
      instructions: medication.instructions || '',
      prescribedBy: medication.prescribedBy || '',
      pharmacy: medication.pharmacy || '',
      refills: medication.refills || 0
    });
    setOpenAddDialog(true);
  };

  if (loading && medications.length === 0 && searchResults.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Medication Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setTabValue(1)}
        >
          Search & Add Medication
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={(e, value) => setTabValue(value)} sx={{ mb: 3 }}>
        <Tab label="My Medications" icon={<Healing />} iconPosition="start" />
        <Tab label="Search Medications" icon={<Search />} iconPosition="start" />
        <Tab label="Adherence Tracking" icon={<TrendingUp />} iconPosition="start" />
      </Tabs>

      <Box sx={{ mt: 3 }}>
        {tabValue === 0 && renderMedicationsList()}
        {tabValue === 1 && renderSearchInterface()}
        {tabValue === 2 && renderAdherenceDashboard()}
      </Box>

      {renderAddMedicationForm()}
      {renderReminderDialog()}
    </Box>
  );
};

export default Medications;