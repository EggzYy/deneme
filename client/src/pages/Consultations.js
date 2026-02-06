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
  Chip,
  Avatar,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextareaAutosize,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Badge,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  VideoCall,
  PersonAdd,
  Search,
  CalendarToday,
  AccessTime,
  LocationOn,
  Phone,
  Chat,
  AttachMoney,
  Description,
  EventNote,
  Send,
  CheckCircle,
  Cancel,
  Visibility,
  Healing,
  History,
  Schedule,
  Star,
  School,
  Work,
  Email,
  Videocam,
  Mic,
  Message
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { consultationService } from '../services/consultationService';

const Consultations = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    specialization: '',
    location: '',
    availability: '',
    rating: '',
    consultationFee: ''
  });
  const [bookingStep, setBookingStep] = useState(0);
  const [consultationData, setConsultationData] = useState({
    doctorId: '',
    consultationType: 'video',
    date: '',
    time: '',
    reason: '',
    symptoms: '',
    isUrgent: false,
    notes: ''
  });
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [openDoctorProfile, setOpenDoctorProfile] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    fetchConsultations();
    fetchDoctors();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await consultationService.getMyConsultations();
      setConsultations(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
      toast.error('Failed to fetch consultations');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await consultationService.getDoctors();
      setDoctors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchDoctors = async () => {
    try {
      setLoading(true);
      const response = await consultationService.getDoctors(searchFilters);
      setDoctors(Array.isArray(response.data) ? response.data : []);
      toast.success(`Found ${response.data.length} doctors`);
    } catch (error) {
      console.error('Error searching doctors:', error);
      toast.error('Failed to search doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenDoctorProfile = (doctor) => {
    setSelectedDoctor(doctor);
    setOpenDoctorProfile(true);
  };

  const handleCloseDoctorProfile = () => {
    setOpenDoctorProfile(false);
    setSelectedDoctor(null);
  };

  const handleOpenBookingDialog = (doctor) => {
    setSelectedDoctor(doctor);
    setConsultationData(prev => ({
      ...prev,
      doctorId: doctor._id
    }));
    setOpenBookingDialog(true);
    setBookingStep(0);
  };

  const handleCloseBookingDialog = () => {
    setOpenBookingDialog(false);
    setSelectedDoctor(null);
    setConsultationData({
      doctorId: '',
      consultationType: 'video',
      date: '',
      time: '',
      reason: '',
      symptoms: '',
      isUrgent: false,
      notes: ''
    });
    setBookingStep(0);
  };

  const handleConsultationInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConsultationData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBookConsultation = async () => {
    try {
      setLoading(true);
      const bookingData = {
        ...consultationData,
        date: new Date(consultationData.date + 'T' + consultationData.time),
        doctorName: selectedDoctor?.name,
        doctorSpecialization: selectedDoctor?.specialization
      };

      const response = await consultationService.bookConsultation(bookingData);
      toast.success('Consultation booked successfully!');
      handleCloseBookingDialog();
      fetchConsultations();
    } catch (error) {
      console.error('Error booking consultation:', error);
      toast.error('Failed to book consultation');
    } finally {
      setLoading(false);
    }
  };

  const handleStartConsultation = async (consultationId) => {
    try {
      setLoading(true);
      const response = await consultationService.startConsultation(consultationId);
      setActiveConsultation(response.data);
      setChatOpen(true);
      toast.success('Consultation started');
    } catch (error) {
      console.error('Error starting consultation:', error);
      toast.error('Failed to start consultation');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConsultation) return;

    try {
      const messageData = {
        consultationId: activeConsultation._id,
        message: newMessage,
        sender: 'patient',
        timestamp: new Date()
      };

      // Add to local messages
      setMessages(prev => [...prev, messageData]);
      setNewMessage('');
      
      // Send via service (this would integrate with Socket.IO in real implementation)
      // await consultationService.sendMessage(activeConsultation._id, messageData);
      
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleCompleteConsultation = async (consultationId) => {
    try {
      setLoading(true);
      const completionData = {
        notes: 'Consultation completed',
        outcome: 'successful',
        followUpRequired: false
      };
      await consultationService.completeConsultation(consultationId, completionData);
      toast.success('Consultation completed');
      fetchConsultations();
    } catch (error) {
      console.error('Error completing consultation:', error);
      toast.error('Failed to complete consultation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConsultation = async (consultationId) => {
    if (window.confirm('Are you sure you want to cancel this consultation?')) {
      try {
        setLoading(true);
        await consultationService.cancelConsultation(consultationId);
        toast.success('Consultation cancelled');
        fetchConsultations();
      } catch (error) {
        console.error('Error cancelling consultation:', error);
        toast.error('Failed to cancel consultation');
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'info';
      case 'in-progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'no-show': return 'default';
      default: return 'default';
    }
  };

  const getConsultationTypeIcon = (type) => {
    switch (type) {
      case 'video': return <Videocam />;
      case 'audio': return <Mic />;
      case 'chat': return <Message />;
      case 'in-person': return <LocationOn />;
      default: return <VideoCall />;
    }
  };

  const renderDoctorCard = (doctor) => (
    <Card key={doctor._id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            sx={{ width: 60, height: 60, mr: 2 }}
            src={doctor.profilePicture}
            alt={doctor.name}
          >
            {doctor.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6">{doctor.name}</Typography>
            <Typography variant="body2" color="textSecondary">
              {doctor.specialization}
            </Typography>
            <Rating value={doctor.rating || 0} readOnly size="small" />
          </Box>
        </Box>

        <Box mb={2}>
          <Box display="flex" alignItems="center" mb={1}>
            <School fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2">{doctor.qualification}</Typography>
          </Box>
          <Box display="flex" alignItems="center" mb={1}>
            <Work fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2">{doctor.hospital}</Typography>
          </Box>
          <Box display="flex" alignItems="center" mb={1}>
            <LocationOn fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2">{doctor.location}</Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <AttachMoney fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2">${doctor.consultationFee}</Typography>
          </Box>
        </Box>

        {doctor.availability && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Availability:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {doctor.availability.slice(0, 3).map((slot, index) => (
                <Chip
                  key={index}
                  label={`${slot.day}: ${slot.startTime}-${slot.endTime}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        {doctor.languages && doctor.languages.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Languages:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {doctor.languages.map((lang, index) => (
                <Chip key={index} label={lang} size="small" />
              ))}
            </Box>
          </Box>
        )}

        <Box display="flex" gap={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleOpenDoctorProfile(doctor)}
          >
            View Profile
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => handleOpenBookingDialog(doctor)}
          >
            Book Now
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderConsultationsList = () => {
    if (consultations.length === 0) {
      return (
        <Alert severity="info">
          No consultations scheduled yet. Find a doctor and book your first consultation!
        </Alert>
      );
    }

    const upcomingConsultations = consultations.filter(c => 
      ['scheduled', 'in-progress'].includes(c.status)
    );
    const pastConsultations = consultations.filter(c => 
      ['completed', 'cancelled', 'no-show'].includes(c.status)
    );

    return (
      <Grid container spacing={2}>
        {upcomingConsultations.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              Upcoming Consultations
            </Typography>
            <Grid container spacing={2}>
              {upcomingConsultations.map((consultation) => (
                <Grid item xs={12} md={6} key={consultation._id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 1 }}>
                            {getConsultationTypeIcon(consultation.consultationType)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1">
                              {consultation.doctorName || 'Dr. TBD'}
                            </Typography>
                            <Chip
                              label={consultation.status}
                              color={getStatusColor(consultation.status)}
                              size="small"
                            />
                          </Box>
                        </Box>
                        <Box>
                          {consultation.status === 'scheduled' && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleStartConsultation(consultation._id)}
                                color="primary"
                                title="Start Consultation"
                              >
                                <Videocam />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleCancelConsultation(consultation._id)}
                                color="error"
                                title="Cancel"
                              >
                                <Cancel />
                              </IconButton>
                            </>
                          )}
                          {consultation.status === 'in-progress' && (
                            <IconButton
                              size="small"
                              onClick={() => setChatOpen(true)}
                              color="primary"
                              title="Open Chat"
                            >
                              <Chat />
                            </IconButton>
                          )}
                        </Box>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center">
                            <CalendarToday fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {new Date(consultation.date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center">
                            <AccessTime fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {new Date(consultation.date).toLocaleTimeString()}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box display="flex" alignItems="center">
                            <Description fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {consultation.reason || consultation.symptoms}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        )}

        {pastConsultations.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Past Consultations
            </Typography>
            <Grid container spacing={2}>
              {pastConsultations.map((consultation) => (
                <Grid item xs={12} md={6} key={consultation._id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle1">
                          {consultation.doctorName || 'Dr. TBD'}
                        </Typography>
                        <Chip
                          label={consultation.status}
                          color={getStatusColor(consultation.status)}
                          size="small"
                        />
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Date
                          </Typography>
                          <Typography variant="body2">
                            {new Date(consultation.date).toLocaleDateString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Type
                          </Typography>
                          <Typography variant="body2">
                            {consultation.consultationType}
                          </Typography>
                        </Grid>
                        {consultation.rating && (
                          <Grid item xs={12}>
                            <Rating value={consultation.rating} readOnly size="small" />
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderDoctorProfile = () => {
    if (!selectedDoctor) return null;

    return (
      <Dialog open={openDoctorProfile} onClose={handleCloseDoctorProfile} maxWidth="lg" fullWidth>
        <DialogTitle>
          Doctor Profile
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Avatar
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                  src={selectedDoctor.profilePicture}
                  alt={selectedDoctor.name}
                >
                  {selectedDoctor.name.charAt(0)}
                </Avatar>
                <Typography variant="h5">{selectedDoctor.name}</Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  {selectedDoctor.specialization}
                </Typography>
                <Rating value={selectedDoctor.rating || 0} readOnly size="small" sx={{ my: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  {selectedDoctor.experience} years experience
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    handleCloseDoctorProfile();
                    handleOpenBookingDialog(selectedDoctor);
                  }}
                  sx={{ mt: 2 }}
                >
                  Book Consultation
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={8}>
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>About</Typography>
                <Typography variant="body1">
                  {selectedDoctor.bio || 'No bio available'}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="h6" gutterBottom>Education & Qualifications</Typography>
                <Typography variant="body1">
                  {selectedDoctor.qualification}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="h6" gutterBottom>Hospital Affiliation</Typography>
                <Typography variant="body1">
                  {selectedDoctor.hospital}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="h6" gutterBottom>Specializations</Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {selectedDoctor.specializations?.map((spec, index) => (
                    <Chip key={index} label={spec} />
                  )) || <Chip label={selectedDoctor.specialization} />}
                </Box>
              </Box>

              {selectedDoctor.languages && selectedDoctor.languages.length > 0 && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>Languages</Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {selectedDoctor.languages.map((lang, index) => (
                      <Chip key={index} label={lang} variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {selectedDoctor.availability && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>Availability</Typography>
                  <Grid container spacing={1}>
                    {selectedDoctor.availability.map((slot, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Paper variant="outlined" sx={{ p: 1 }}>
                          <Typography variant="body2">
                            <strong>{slot.day}:</strong> {slot.startTime} - {slot.endTime}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDoctorProfile}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderBookingWizard = () => {
    if (!selectedDoctor) return null;

    const steps = ['Select Type', 'Choose Date & Time', 'Provide Details', 'Confirm'];

    return (
      <Dialog open={openBookingDialog} onClose={handleCloseBookingDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Book Consultation with Dr. {selectedDoctor.name}
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={bookingStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {bookingStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>Select Consultation Type</Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  name="consultationType"
                  value={consultationData.consultationType}
                  onChange={handleConsultationInputChange}
                >
                  <FormControlLabel
                    value="video"
                    control={<Radio />}
                    label={
                      <Box display="flex" alignItems="center">
                        <Videocam sx={{ mr: 1 }} />
                        Video Consultation
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="audio"
                    control={<Radio />}
                    label={
                      <Box display="flex" alignItems="center">
                        <Mic sx={{ mr: 1 }} />
                        Audio Consultation
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="chat"
                    control={<Radio />}
                    label={
                      <Box display="flex" alignItems="center">
                        <Message sx={{ mr: 1 }} />
                        Chat Consultation
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </Box>
          )}

          {bookingStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Choose Date & Time</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    name="date"
                    value={consultationData.date}
                    onChange={handleConsultationInputChange}
                    required
                    inputProps={{
                      min: new Date().toISOString().split('T')[0]
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Time"
                    type="time"
                    name="time"
                    value={consultationData.time}
                    onChange={handleConsultationInputChange}
                    required
                  />
                </Grid>
              </Grid>
              <Alert severity="info" sx={{ mt: 2 }}>
                Please select a time during the doctor's available hours
              </Alert>
            </Box>
          )}

          {bookingStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>Consultation Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reason for Consultation"
                    name="reason"
                    value={consultationData.reason}
                    onChange={handleConsultationInputChange}
                    required
                    multiline
                    rows={2}
                    helperText="Briefly describe why you need this consultation"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Symptoms (Optional)"
                    name="symptoms"
                    value={consultationData.symptoms}
                    onChange={handleConsultationInputChange}
                    multiline
                    rows={3}
                    helperText="Describe any symptoms you're experiencing"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Additional Notes (Optional)"
                    name="notes"
                    value={consultationData.notes}
                    onChange={handleConsultationInputChange}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="isUrgent"
                        checked={consultationData.isUrgent}
                        onChange={handleConsultationInputChange}
                      />
                    }
                    label="This is an urgent consultation"
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {bookingStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>Confirm Booking</Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Doctor:</strong> Dr. {selectedDoctor.name}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Type:</strong> {consultationData.consultationType}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Date & Time:</strong> {consultationData.date} at {consultationData.time}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Reason:</strong> {consultationData.reason}
                </Typography>
                {consultationData.symptoms && (
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Symptoms:</strong> {consultationData.symptoms}
                  </Typography>
                )}
                {consultationData.isUrgent && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    This consultation is marked as urgent
                  </Alert>
                )}
              </Paper>
              <Alert severity="info" sx={{ mt: 2 }}>
                You will receive a confirmation email with consultation details and access link.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBookingDialog}>Cancel</Button>
          {bookingStep > 0 && (
            <Button onClick={() => setBookingStep(prev => prev - 1)}>
              Back
            </Button>
          )}
          {bookingStep < steps.length - 1 && (
            <Button
              onClick={() => setBookingStep(prev => prev + 1)}
              variant="contained"
              disabled={!consultationData.consultationType}
            >
              Next
            </Button>
          )}
          {bookingStep === steps.length - 1 && (
            <Button
              onClick={handleBookConsultation}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              Confirm Booking
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  const renderChatInterface = () => {
    if (!chatOpen || !activeConsultation) return null;

    return (
      <Dialog open={chatOpen} onClose={() => setChatOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Consultation Chat
        </DialogTitle>
        <DialogContent>
          <Paper sx={{ height: 400, overflowY: 'auto', p: 2, mb: 2 }}>
            {messages.length === 0 ? (
              <Typography variant="body2" color="textSecondary" align="center">
                No messages yet. Start the conversation!
              </Typography>
            ) : (
              messages.map((message, index) => (
                <Box
                  key={index}
                  display="flex"
                  justifyContent={message.sender === 'patient' ? 'flex-end' : 'flex-start'}
                  mb={1}
                >
                  <Paper
                    sx={{
                      p: 1,
                      maxWidth: '70%',
                      bgcolor: message.sender === 'patient' ? 'primary.main' : 'grey.300',
                      color: message.sender === 'patient' ? 'white' : 'inherit'
                    }}
                  >
                    <Typography variant="body2">{message.message}</Typography>
                    <Typography variant="caption" display="block" align="right">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Paper>
                </Box>
              ))
            )}
          </Paper>
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              label="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCompleteConsultation(activeConsultation._id)}>
            End Consultation
          </Button>
          <Button onClick={() => setChatOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderDoctorSearch = () => {
    return (
      <Box>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Find Healthcare Providers
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Specialization"
                name="specialization"
                value={searchFilters.specialization}
                onChange={handleFilterChange}
                placeholder="e.g., Cardiology"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={searchFilters.location}
                onChange={handleFilterChange}
                placeholder="City or Zip Code"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Rating</InputLabel>
                <Select
                  name="rating"
                  value={searchFilters.rating}
                  onChange={handleFilterChange}
                  label="Rating"
                >
                  <MenuItem value="">Any Rating</MenuItem>
                  <MenuItem value="4">4+ Stars</MenuItem>
                  <MenuItem value="4.5">4.5+ Stars</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Consultation Fee</InputLabel>
                <Select
                  name="consultationFee"
                  value={searchFilters.consultationFee}
                  onChange={handleFilterChange}
                  label="Consultation Fee"
                >
                  <MenuItem value="">Any Price</MenuItem>
                  <MenuItem value="0-50">$0 - $50</MenuItem>
                  <MenuItem value="50-100">$50 - $100</MenuItem>
                  <MenuItem value="100+">$100+</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={handleSearchDoctors}
                disabled={loading}
              >
                Search Doctors
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {doctors.length > 0 ? (
          <Grid container spacing={3}>
            {doctors.map((doctor) => (
              <Grid item xs={12} md={6} lg={4} key={doctor._id}>
                {renderDoctorCard(doctor)}
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            Use the search filters above to find healthcare providers matching your needs.
          </Alert>
        )}
      </Box>
    );
  };

  if (loading && consultations.length === 0 && doctors.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Consultations</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Search />}
          onClick={() => setTabValue(1)}
        >
          Find Doctors
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={(e, value) => setTabValue(value)} sx={{ mb: 3 }}>
        <Tab label="My Consultations" icon={<History />} iconPosition="start" />
        <Tab label="Find Doctors" icon={<Search />} iconPosition="start" />
      </Tabs>

      <Box sx={{ mt: 3 }}>
        {tabValue === 0 && renderConsultationsList()}
        {tabValue === 1 && renderDoctorSearch()}
      </Box>

      {renderDoctorProfile()}
      {renderBookingWizard()}
      {renderChatInterface()}
    </Box>
  );
};

export default Consultations;