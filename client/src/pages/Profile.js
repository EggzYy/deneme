import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Avatar,
  Tabs,
  Tab,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Person,
  HealthAndSafety,
  Notifications,
  Security,
  Edit,
  Save,
  Cancel,
  PhotoCamera,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { healthService } from '../services/healthService';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [healthProfile, setHealthProfile] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: '',
    },
  });

  // Insurance Information State
  const [insurance, setInsurance] = useState({
    provider: '',
    policyNumber: '',
    groupNumber: '',
    memberName: '',
  });

  // Preferences State
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    privacy: {
      shareDataForResearch: false,
      allowContactForSurveys: false,
    },
  });

  // Health Profile State
  const [healthProfileData, setHealthProfileData] = useState({
    bloodType: '',
    height: '',
    weight: '',
    allergies: [],
    currentConditions: [],
    medications: [],
    chronicDiseases: [],
    surgeries: [],
    familyHistory: [],
    immunizations: [],
    lifestyle: {
      smokingStatus: 'never',
      alcoholConsumption: 'none',
      exerciseFrequency: 'moderate',
      dietType: 'balanced',
      sleepHours: 7,
    },
  });

  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  useEffect(() => {
    if (user) {
      // Set personal information from user
      setPersonalInfo({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        gender: user.gender || '',
        phone: user.phone || '',
        address: user.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        emergencyContact: user.emergencyContact || {
          name: '',
          relationship: '',
          phone: '',
          email: '',
        },
      });

      setInsurance(user.insurance || {
        provider: '',
        policyNumber: '',
        groupNumber: '',
        memberName: '',
      });

      setPreferences(user.preferences || {
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        privacy: {
          shareDataForResearch: false,
          allowContactForSurveys: false,
        },
      });

      // Fetch health profile
      loadHealthProfile();
    }
  }, [user]);

  const loadHealthProfile = async () => {
    try {
      setLoadingHealth(true);
      const response = await healthService.getHealthProfile();
      if (response.data.success && response.data.profile) {
        const profile = response.data.profile;
        setHealthProfile(profile);
        setHealthProfileData({
          bloodType: profile.bloodType || '',
          height: profile.height || '',
          weight: profile.weight || '',
          allergies: profile.allergies || [],
          currentConditions: profile.currentConditions || [],
          medications: profile.medications || [],
          chronicDiseases: profile.chronicDiseases || [],
          surgeries: profile.surgeries || [],
          familyHistory: profile.familyHistory || [],
          immunizations: profile.immunizations || [],
          lifestyle: profile.lifestyle || {
            smokingStatus: 'never',
            alcoholConsumption: 'none',
            exerciseFrequency: 'moderate',
            dietType: 'balanced',
            sleepHours: 7,
          },
        });
      }
    } catch (error) {
      console.error('Error loading health profile:', error);
    } finally {
      setLoadingHealth(false);
    }
  };

  const handlePersonalInfoChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setPersonalInfo(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setPersonalInfo(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleInsuranceChange = (field, value) => {
    setInsurance(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePreferenceChange = (category, field, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleHealthProfileChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setHealthProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setHealthProfileData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim()) {
      setHealthProfileData(prev => ({
        ...prev,
        allergies: [...prev.allergies, { name: newAllergy, severity: 'moderate' }],
      }));
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (index) => {
    setHealthProfileData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index),
    }));
  };

  const handleAddCondition = () => {
    if (newCondition.trim()) {
      setHealthProfileData(prev => ({
        ...prev,
        currentConditions: [...prev.currentConditions, newCondition],
      }));
      setNewCondition('');
    }
  };

  const handleRemoveCondition = (index) => {
    setHealthProfileData(prev => ({
      ...prev,
      currentConditions: prev.currentConditions.filter((_, i) => i !== index),
    }));
  };

  const handleSavePersonalInfo = async () => {
    try {
      setLoading(true);
      const response = await authService.updateProfile({
        ...personalInfo,
        insurance,
        preferences,
      });

      if (response.data.success) {
        updateUser(response.data.user);
        toast.success('Personal information updated successfully');
        setEditMode(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHealthProfile = async () => {
    try {
      setLoading(true);
      const response = healthProfile
        ? await healthService.updateHealthProfile(healthProfileData)
        : await healthService.createHealthProfile(healthProfileData);

      if (response.data.success) {
        setHealthProfile(response.data.profile);
        toast.success('Health profile updated successfully');
        setEditMode(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update health profile');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setEditMode(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">My Profile</Typography>
        <Button
          variant={editMode ? 'outlined' : 'contained'}
          startIcon={editMode ? <Cancel /> : <Edit />}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Cancel Edit' : 'Edit Profile'}
        </Button>
      </Box>

      <Card>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<Person />} label="Personal Info" />
          <Tab icon={<HealthAndSafety />} label="Health Profile" />
          <Tab icon={<Notifications />} label="Preferences" />
        </Tabs>

        <CardContent sx={{ p: 3 }}>
          {/* Personal Information Tab */}
          {tabValue === 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Avatar
                  src={user?.profilePicture}
                  alt={user?.firstName}
                  sx={{ width: 100, height: 100, mr: 3 }}
                >
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Avatar>
                {editMode && (
                  <IconButton color="primary" component="label">
                    <PhotoCamera />
                    <input hidden accept="image/*" type="file" />
                  </IconButton>
                )}
              </Box>

              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={personalInfo.firstName}
                    onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={personalInfo.lastName}
                    onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={user?.email}
                    disabled
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={personalInfo.phone}
                    onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    value={personalInfo.dateOfBirth}
                    onChange={(e) => handlePersonalInfoChange('dateOfBirth', e.target.value)}
                    disabled={!editMode}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={!editMode}>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={personalInfo.gender}
                      onChange={(e) => handlePersonalInfoChange('gender', e.target.value)}
                      label="Gender"
                    >
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                      <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>Address</Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={personalInfo.address.street}
                    onChange={(e) => handlePersonalInfoChange('address.street', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={personalInfo.address.city}
                    onChange={(e) => handlePersonalInfoChange('address.city', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="State/Province"
                    value={personalInfo.address.state}
                    onChange={(e) => handlePersonalInfoChange('address.state', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Zip Code"
                    value={personalInfo.address.zipCode}
                    onChange={(e) => handlePersonalInfoChange('address.zipCode', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={personalInfo.address.country}
                    onChange={(e) => handlePersonalInfoChange('address.country', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>Emergency Contact</Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={personalInfo.emergencyContact.name}
                    onChange={(e) => handlePersonalInfoChange('emergencyContact.name', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Relationship"
                    value={personalInfo.emergencyContact.relationship}
                    onChange={(e) => handlePersonalInfoChange('emergencyContact.relationship', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={personalInfo.emergencyContact.phone}
                    onChange={(e) => handlePersonalInfoChange('emergencyContact.phone', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={personalInfo.emergencyContact.email}
                    onChange={(e) => handlePersonalInfoChange('emergencyContact.email', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>Insurance Information</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Insurance Provider"
                    value={insurance.provider}
                    onChange={(e) => handleInsuranceChange('provider', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Policy Number"
                    value={insurance.policyNumber}
                    onChange={(e) => handleInsuranceChange('policyNumber', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Group Number"
                    value={insurance.groupNumber}
                    onChange={(e) => handleInsuranceChange('groupNumber', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Member Name"
                    value={insurance.memberName}
                    onChange={(e) => handleInsuranceChange('memberName', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
              </Grid>

              {editMode && (
                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                    onClick={handleSavePersonalInfo}
                    disabled={loading}
                  >
                    Save Changes
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Health Profile Tab */}
          {tabValue === 1 && (
            <Box>
              {loadingHealth ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>Basic Health Information</Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth disabled={!editMode}>
                        <InputLabel>Blood Type</InputLabel>
                        <Select
                          value={healthProfileData.bloodType}
                          onChange={(e) => handleHealthProfileChange('bloodType', e.target.value)}
                          label="Blood Type"
                        >
                          <MenuItem value="A+">A+</MenuItem>
                          <MenuItem value="A-">A-</MenuItem>
                          <MenuItem value="B+">B+</MenuItem>
                          <MenuItem value="B-">B-</MenuItem>
                          <MenuItem value="AB+">AB+</MenuItem>
                          <MenuItem value="AB-">AB-</MenuItem>
                          <MenuItem value="O+">O+</MenuItem>
                          <MenuItem value="O-">O-</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Height (cm)"
                        type="number"
                        value={healthProfileData.height}
                        onChange={(e) => handleHealthProfileChange('height', e.target.value)}
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Weight (kg)"
                        type="number"
                        value={healthProfileData.weight}
                        onChange={(e) => handleHealthProfileChange('weight', e.target.value)}
                        disabled={!editMode}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom>Allergies</Typography>
                  <Box sx={{ mb: 3 }}>
                    {healthProfileData.allergies.map((allergy, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 2,
                          mb: 1,
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                        }}
                      >
                        <Typography>{allergy.name} - {allergy.severity}</Typography>
                        {editMode && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleRemoveAllergy(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </Box>
                    ))}
                    {editMode && (
                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <TextField
                          fullWidth
                          label="Add Allergy"
                          value={newAllergy}
                          onChange={(e) => setNewAllergy(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddAllergy()}
                        />
                        <Button variant="outlined" onClick={handleAddAllergy}>
                          Add
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom>Current Conditions</Typography>
                  <Box sx={{ mb: 3 }}>
                    {healthProfileData.currentConditions.map((condition, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 2,
                          mb: 1,
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                        }}
                      >
                        <Typography>{condition}</Typography>
                        {editMode && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleRemoveCondition(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </Box>
                    ))}
                    {editMode && (
                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <TextField
                          fullWidth
                          label="Add Condition"
                          value={newCondition}
                          onChange={(e) => setNewCondition(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddCondition()}
                        />
                        <Button variant="outlined" onClick={handleAddCondition}>
                          Add
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom>Lifestyle Information</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth disabled={!editMode}>
                        <InputLabel>Smoking Status</InputLabel>
                        <Select
                          value={healthProfileData.lifestyle.smokingStatus}
                          onChange={(e) => handleHealthProfileChange('lifestyle.smokingStatus', e.target.value)}
                          label="Smoking Status"
                        >
                          <MenuItem value="never">Never</MenuItem>
                          <MenuItem value="former">Former</MenuItem>
                          <MenuItem value="current">Current</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth disabled={!editMode}>
                        <InputLabel>Alcohol Consumption</InputLabel>
                        <Select
                          value={healthProfileData.lifestyle.alcoholConsumption}
                          onChange={(e) => handleHealthProfileChange('lifestyle.alcoholConsumption', e.target.value)}
                          label="Alcohol Consumption"
                        >
                          <MenuItem value="none">None</MenuItem>
                          <MenuItem value="occasional">Occasional</MenuItem>
                          <MenuItem value="moderate">Moderate</MenuItem>
                          <MenuItem value="heavy">Heavy</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth disabled={!editMode}>
                        <InputLabel>Exercise Frequency</InputLabel>
                        <Select
                          value={healthProfileData.lifestyle.exerciseFrequency}
                          onChange={(e) => handleHealthProfileChange('lifestyle.exerciseFrequency', e.target.value)}
                          label="Exercise Frequency"
                        >
                          <MenuItem value="sedentary">Sedentary</MenuItem>
                          <MenuItem value="light">Light (1-2 days/week)</MenuItem>
                          <MenuItem value="moderate">Moderate (3-5 days/week)</MenuItem>
                          <MenuItem value="active">Active (6-7 days/week)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth disabled={!editMode}>
                        <InputLabel>Diet Type</InputLabel>
                        <Select
                          value={healthProfileData.lifestyle.dietType}
                          onChange={(e) => handleHealthProfileChange('lifestyle.dietType', e.target.value)}
                          label="Diet Type"
                        >
                          <MenuItem value="balanced">Balanced</MenuItem>
                          <MenuItem value="vegetarian">Vegetarian</MenuItem>
                          <MenuItem value="vegan">Vegan</MenuItem>
                          <MenuItem value="keto">Keto</MenuItem>
                          <MenuItem value="mediterranean">Mediterranean</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Average Sleep Hours"
                        type="number"
                        value={healthProfileData.lifestyle.sleepHours}
                        onChange={(e) => handleHealthProfileChange('lifestyle.sleepHours', e.target.value)}
                        disabled={!editMode}
                        inputProps={{ min: 0, max: 24, step: 0.5 }}
                      />
                    </Grid>
                  </Grid>

                  {editMode && (
                    <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        onClick={() => setEditMode(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                        onClick={handleSaveHealthProfile}
                        disabled={loading}
                      >
                        Save Health Profile
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}

          {/* Preferences Tab */}
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>Notification Preferences</Typography>
              <Box sx={{ mb: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.notifications.email}
                      onChange={(e) => handlePreferenceChange('notifications', 'email', e.target.checked)}
                      disabled={!editMode}
                    />
                  }
                  label="Email Notifications"
                />
                <Typography variant="body2" color="textSecondary" sx={{ ml: 4, mb: 2 }}>
                  Receive appointment reminders, medication alerts, and health insights via email
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.notifications.push}
                      onChange={(e) => handlePreferenceChange('notifications', 'push', e.target.checked)}
                      disabled={!editMode}
                    />
                  }
                  label="Push Notifications"
                />
                <Typography variant="body2" color="textSecondary" sx={{ ml: 4, mb: 2 }}>
                  Receive real-time notifications in the app
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.notifications.sms}
                      onChange={(e) => handlePreferenceChange('notifications', 'sms', e.target.checked)}
                      disabled={!editMode}
                    />
                  }
                  label="SMS Notifications"
                />
                <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                  Receive text messages for critical health alerts
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>Privacy Settings</Typography>
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.privacy.shareDataForResearch}
                      onChange={(e) => handlePreferenceChange('privacy', 'shareDataForResearch', e.target.checked)}
                      disabled={!editMode}
                    />
                  }
                  label="Share Data for Research"
                />
                <Typography variant="body2" color="textSecondary" sx={{ ml: 4, mb: 2 }}>
                  Allow anonymized health data to be used for medical research
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.privacy.allowContactForSurveys}
                      onChange={(e) => handlePreferenceChange('privacy', 'allowContactForSurveys', e.target.checked)}
                      disabled={!editMode}
                    />
                  }
                  label="Allow Contact for Surveys"
                />
                <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                  Participate in user experience surveys and feedback
                </Typography>
              </Box>

              {editMode && (
                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                    onClick={handleSavePersonalInfo}
                    disabled={loading}
                  >
                    Save Preferences
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;
